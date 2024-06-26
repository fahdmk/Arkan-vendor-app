import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  Image,
  Button,
  StyleSheet,
  TextInput
} from "react-native";
import { Card } from "react-native-paper";
import Modal from "react-native-modal";

const Home = ({ route }) => {
  const { token } = route.params;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalVisibleArray, setModalVisibleArray] = useState([]);
  const [visibleProducts, setVisibleProducts] = useState(10);
  const [modalPrice, setModalPrice] = useState('');
  const [modalQuantity, setModalQuantity] = useState('');
  const [modalName, setModalName] = useState('');
  const [price, setPrice] = useState(0);

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
          setProducts(data[0].items);
          setModalVisibleArray(Array(data[0].items.length).fill(false));
          data[0].items.slice(0, visibleProducts).forEach((item) => fetchAdditionalData(item.sku, token));
        }
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [token, visibleProducts]);

  const fetchAdditionalData = async (sku, token) => {
    try {
      const productResponse = fetch(
        `http://10.233.219.18/magento2/pub/rest/all/V1/products/${sku}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const stockResponse = fetch(
        `http://10.233.219.18/magento2/pub/rest/all/V1/stockStatuses/${sku}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const [productData, stockData] = await Promise.all([productResponse, stockResponse]);
      
      if (!productData.ok) {
        throw new Error(`Failed to fetch additional data for SKU: ${sku}`);
      }

      if (!stockData.ok) {
        throw new Error(`Failed to fetch stock data for SKU: ${sku}`);
      }

      const productJson = await productData.json();
      const stockJson = await stockData.json();

      setProducts((prevProducts) =>
        prevProducts.map((product) =>
          product.sku === sku ? { ...product, additionalData: productJson, stockData: stockJson } : product
        )
      );
    } catch (error) {
      console.error(error);
    }
  };

  const extractImageUrl = (product) => {
    if (!product.additionalData || !product.additionalData.custom_attributes) {
      return null;
    }

    const imageAttribute = product.additionalData.custom_attributes.find(
      (attr) => attr.attribute_code === "image"
    );
    return imageAttribute
      ? `https://arkan.tn/media/catalog/product${imageAttribute.value}`
      : null;
  };

  const handleUpdate = async (item) => {
    try {
      const response = await fetch(
        `http://10.233.219.18/magento2/pub/rest/V1/mpapi/sellers/me/addproduct`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            product: {
              sku: item.sku,
              price: modalPrice || item.price,
              extension_attributes: {
                stock_item: {
                  manage_stock: 1,
                  use_config_manage_stock: 1,
                  qty: modalQuantity || item.stockData.qty,
                  is_in_stock: 1
                },
                category_links: []
              }
            }
          }),
        }
      );
      const responseData = await response.json();

      console.log(responseData);

      if (!response.ok) {
        throw new Error(`Failed to update product: ${response.status}`);
      }

      toggleModal(item.id); 
    } catch (error) {
      console.error(error);
    }
  };

  const handlePriceChange = (value) => {
    setModalPrice(value); 
  };

  const handleQuantityChange = (value) => {
    setModalQuantity(value);
  };

  const handleNameChange = (value) => {
    setModalName(value);
  };

  const toggleModal = (index) => {
    const newModalVisibleArray = [...modalVisibleArray];
    newModalVisibleArray[index] = !newModalVisibleArray[index];
    setModalVisibleArray(newModalVisibleArray);

    if (!newModalVisibleArray[index]) {
      const item = products[index];
      setModalPrice(item.additionalData ? item.additionalData.price.toString() : '');
      setModalQuantity(item.stockData ? item.stockData.qty.toString() : '');
      setModalName(item.name);
    }
  };

  const loadMoreProducts = () => {
    setVisibleProducts(visibleProducts + 10);
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
      <FlatList
        data={products.slice(0, visibleProducts)}
        keyExtractor={(item) => item.mageproduct_id}
        renderItem={({ item, index }) => {
          const imageUrl = extractImageUrl(item);
          return (
            <>
              <Modal isVisible={modalVisibleArray[index]}>
                <View style={styles.modalContent}>
                  <Text style={styles.text}>{item.name}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Price"
                    value={modalPrice}
                    onChangeText={handlePriceChange}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Quantity"
                    value={modalQuantity}
                    onChangeText={handleQuantityChange}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Name"
                    value={modalName}
                    onChangeText={handleNameChange}
                  />
                  <Button title="sauvegarder" onPress={() => handleUpdate(item)} />
                </View>
              </Modal>
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
                        onPress={() => toggleModal(index)}
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
            </>
          );
        }}
      />
      {visibleProducts < products.length && (
        <Button title="Load More" onPress={loadMoreProducts} />
      )}
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
  input: {
    height: 40,
    width: '80%',
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10
  },
});

export default Home;
