import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  Switch,
  TouchableOpacity,
  TextInput,
} from "react-native";
import {
  Card,
  Title,
  Paragraph,
  Button,
  IconButton,
  ActivityIndicator,
} from "react-native-paper";
import Modal from "react-native-modal";

const Home = ({ route }) => {
  const { token } = route.params;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalVisibleArray, setModalVisibleArray] = useState([]);
  const [visibleProducts, setVisibleProducts] = useState(10);
  const [modalPrice, setModalPrice] = useState("");
  const [modalQuantity, setModalQuantity] = useState("");
  const [modalName, setModalName] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const flatListRef = useRef(null);
  const [isInStock, setIsInStock] = useState(null);

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
          data[0].items
            .slice(0, visibleProducts)
            .forEach((item) => fetchAdditionalData(item.sku, token));
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

      const [productData, stockData] = await Promise.all([
        productResponse,
        stockResponse,
      ]);

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
          product.sku === sku
            ? { ...product, additionalData: productJson, stockData: stockJson }
            : product
        )
      );
    } catch (error) {
      console.error(error);
    }
  };

  const extractImageUrl = (product) => {
    if (!product.additionalData || !product.additionalData) {
      return null;
    }

    const imageAttribute = product.additionalData.custom_attributes.find(
      (attr) => attr.attribute_code === "image"
    );
    return imageAttribute
      ? `https://arkan.tn/media/catalog/product${imageAttribute.value}`
      : null;
  };

  const handleUpdate = async (item, currentIsInStock) => {
    try {
      const response = await fetch(
        "http://10.233.219.18/magento2/pub/rest/V1/mpapi/sellers/me/addproduct",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            product: {
              sku: item.sku,
              price: parseFloat(modalPrice) || item.price,
              // short_description:parseFloat(shortdesc)|| item.short_description,
              extension_attributes: {
                stock_item: {
                  manage_stock: 1,
                  use_config_manage_stock: 1,
                  qty: parseInt(modalQuantity) || item.stockData.qty,
                  is_in_stock: currentIsInStock,
                },
                category_links: [],
              },
            },
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
      setModalPrice(
        item.additionalData ? item.additionalData.price.toString() : ""
      );
      setModalQuantity(item.stockData ? item.stockData.qty.toString() : "");
      setModalName(item.name);
    }
  };
  const loadMoreProducts = useCallback(async () => {
    if (isFetching) return;

    setIsFetching(true);
    try {
      const nextPageStartIndex = visibleProducts;
      const nextPageEndIndex = visibleProducts + 10;
      const productsToLoad = products.slice(
        nextPageStartIndex,
        nextPageEndIndex
      );

      const additionalDataPromises = productsToLoad.map((item) =>
        fetchAdditionalData(item.sku, token)
      );
      await Promise.all(additionalDataPromises);
      setVisibleProducts((prevVisibleProducts) => prevVisibleProducts + 10);
    } finally {
      setIsFetching(false);
    }
  }, [isFetching, visibleProducts, products, token]);

  const renderFooter = () => {
    if (isFetching) {
      return <ActivityIndicator size="large" color="#0000ff" />;
    } else {
      return null;
    }
  };
  const handleScroll = (event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isCloseToBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 100;

    if (isCloseToBottom && !isFetching) {
      loadMoreProducts();
    }
  };

  const getStatusStyle = (isInStock) => ({
    borderColor: isInStock ? "green" : "red",
    backgroundColor: isInStock ? "green" : "red",
    padding: 2,
    borderRadius: 25,
    textAlign: "center",
  });

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
        ref={flatListRef}
        data={products.slice(0, visibleProducts)}
        keyExtractor={(item) => item.mageproduct_id}
        renderItem={({ item, index }) => {
          const imageUrl = extractImageUrl(item);
          const isInStock = item.stockData
            ? item.stockData.stock_item.is_in_stock
            : null;
          return (
            <>
              <Modal isVisible={modalVisibleArray[index]}>
                <View style={styles.modalContent}>
                  <Text style={styles.text}>{item.name}</Text>
                  <Text
                    style={{
                      alignSelf: "flex-start",
                      paddingLeft: "10%",
                      fontWeight: "bold",
                    }}
                  >
                    Prix
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Price"
                    value={modalPrice}
                    onChangeText={handlePriceChange}
                    keyboardType="numeric"
                  />
                  <Text
                    style={{
                      alignSelf: "flex-start",
                      paddingLeft: "10%",
                      fontWeight: "bold",
                    }}
                  >
                    Quantité
                  </Text>

                  <TextInput
                    style={styles.input}
                    placeholder="Quantity"
                    value={modalQuantity}
                    onChangeText={handleQuantityChange}
                    keyboardType="numeric"
                  />
                  <Text
                    style={{
                      alignSelf: "flex-start",
                      paddingLeft: "10%",
                      fontWeight: "bold",
                    }}
                  >
                    Nom
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Name"
                    value={modalName}
                    onChangeText={handleNameChange}
                  />
                  <View style={styles.switchContainer}>
                    <Text>In Stock:</Text>
                    <Switch value={isInStock} onValueChange={setIsInStock} />
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      { backgroundColor: "lightgreen" },
                    ]}
                    onPress={() => handleUpdate(item, isInStock)}
                  >
                    <Text style={styles.modalButtonText}>Sauvegarder</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: "grey" }]}
                    onPress={() => {
                      toggleModal(index);
                      console.log(
                        item.additionalData.custom_attributes.find(item => item.attribute_code === "short_description").value
                      );
                    }}
                  >
                    <Text
                      style={[
                        styles.modalButtonText,
                        { color: "white", fontWeight: "bold" },
                      ]}
                    >
                      Fermer
                    </Text>
                  </TouchableOpacity>
                </View>
              </Modal>
              <TouchableOpacity
                key={item.id}
                style={styles.productCard}
                onPress={() => {}}
              >
                <Card style={styles.card}>
                  <Title style={styles.productTitle}>{item.name}</Title>
                  <View style={styles.productContent}>
                    <Image
                      source={{ uri: extractImageUrl(item) }}
                      style={styles.productImage}
                    />
                    <View style={styles.separator} />
                    <View style={styles.productInfo}>
                      <Paragraph style={styles.productDetails}>
                        Identifiant:{" "}
                        {item.additionalData ? item.additionalData.id : "N/A"}
                      </Paragraph>
                      <Paragraph style={styles.productDetails}>
                        Prix:{" "}
                        {item.additionalData
                          ? item.additionalData.price
                          : "N/A"}{" "}
                        TND
                      </Paragraph>
                      <Paragraph style={styles.productDetails}>
                        Stock: {item.stockData ? item.stockData.qty : "N/A"}
                      </Paragraph>
                      <Paragraph
                        style={[styles.stock, getStatusStyle(isInStock)]}
                      >
                        {isInStock ? "on stock" : "Hors Stock"}
                      </Paragraph>
                    </View>
                  </View>
                  <View style={styles.actions}>
                    <IconButton
                      icon="pencil"
                      color="#007bff"
                      size={20}
                      onPress={() => toggleModal(index)}
                    />
                    <IconButton
                      icon="delete"
                      color="#f44336"
                      size={20}
                      onPress={() => {}}
                    />
                  </View>
                </Card>
              </TouchableOpacity>
            </>
          );
        }}
        ListFooterComponent={renderFooter}
        onEndReachedThreshold={0.5}
        onEndReached={loadMoreProducts}
        onScroll={handleScroll}
      />
    </View>
  );
};

const styles = StyleSheet.create({
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
    width: "80%",
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    padding: 10,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  productContainer: {
    flexDirection: "column",
  },
  productCard: {
    marginBottom: 10,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    elevation: 3,
    marginHorizontal: 10,
    marginBottom: 20,
    padding: 10,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  productContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  productImage: {
    width: 145,
    height: 145,
    borderRadius: 5,
    marginBottom: 10,
  },
  modalButton: {
    padding: 10,
    borderRadius: 30,
    marginVertical: 5,
    alignItems: "center",
    width: "40%",
  },
  modalButtonText: {
    color: "White",
    fontSize: 17,
    fontWeight: "bold",
  },
  separator: {
    width: 0.1,
    backgroundColor: "#ccc",
    marginHorizontal: 3,
  },
  productInfo: {
    flex: 1,
    justifyContent: "center",
  },
  productDetails: {
    fontSize: 14,
    color: "#777",
    marginBottom: 5,
  },
  stock: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 20,
    width: 100,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: "#007bff",
  },
  modalContainer: {
    backgroundColor: "white",
    padding: 20,
    margin: 20,
    borderRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  saveButton: {
    flex: 1,
    marginRight: 10,
    backgroundColor: "#007bff",
  },
  cancelButton: {
    flex: 1,
    marginLeft: 10,
  },
});

export default Home;
