import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  Image,
  Button,
  StyleSheet,
} from "react-native";
import { Card } from "react-native-paper";
import Modal from "react-native-modal";

const Home = ({ route }) => {
  const { token } = route.params;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(
          "http://10.233.219.18/magento2/pub/rest/V1/mpapi/sellers/me/product",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }

        const data = await response.json();
        if (data.length > 0) {
          const productsWithDetails = await Promise.all(
            data[0].items.map(async (item) => {
              const additionalData = await fetchAdditionalData(item.sku, token);
              return { ...item, additionalData };
            })
          );
          setProducts(productsWithDetails);
        }
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [token]);

  const fetchAdditionalData = async (sku, token) => {
    try {
      const response = await fetch(
        `http://10.233.219.18/magento2/pub/rest/all/V1/products/${sku}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch additional data for SKU: ${sku}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const extractImageUrl = (product) => {
    if (!product.additionalData || !product.additionalData.custom_attributes) {
      return null;
    }

    const imageAttribute = product.additionalData.custom_attributes.find(
      (attr) => attr.attribute_code === "image"
    );
    console.log(imageAttribute);
    return imageAttribute
      ? `https://arkan.tn/media/catalog/product${imageAttribute.value}`
      : null;
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  if (error) {
    return (
      <View>
        <Text>Error: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Modal isVisible={isModalVisible}>
        <View style={styles.modalContent}>
          <Text style={styles.text}>Agree to continue with this guide</Text>
          <Button title="I agree" onPress={() => setIsModalVisible(false)} />
        </View>
      </Modal>
      <FlatList
        data={products}
        keyExtractor={(item) => item.mageproduct_id}
        renderItem={({ item }) => {
          const imageUrl = extractImageUrl(item);
          return (
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.name}>{item.name}</Text>
                {imageUrl ? (
                  <Image source={{ uri: imageUrl }} style={styles.image} />
                ) : (
                  <Text>No Image Available</Text>
                )}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <View>
                    <Button
                      onPress={() => setIsModalVisible(true)}
                      title="Modifier"
                      color="green"
                    />
                  </View>
                  <View>
                    <Text style={{ fontWeight: "bold", fontSize: 20 }}>
                      {item.additionalData ? item.additionalData.price : "N/A"}{" "}
                      TND
                    </Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  card: {
    margin: 10,
    backgroundColor: "white",
  },
  image: {
    width: "100%",
    height: 200,
    resizeMode: "contain",
  },
  name: {
    fontSize: 14,
    fontWeight: "bold",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 22,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 4,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  text: {
    fontSize: 18,
    marginBottom: 12,
  },
});

export default Home;
