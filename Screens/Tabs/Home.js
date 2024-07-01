import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import {
  Card,
  Title,
  Paragraph,
  IconButton,
  ActivityIndicator,
} from "react-native-paper";
import Modal from "react-native-modal";
import { Dropdown } from "react-native-element-dropdown";

const Home = ({ route }) => {
  const { token, tokena } = route.params;
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
  const [isFocus, setIsFocus] = useState(false);
  const [seller_id, setSellerID] = useState();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const sellerResponse = await fetch(`http://10.233.219.18/magento2/pub/rest/V1/mpapi/sellers/me`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
  
        if (!sellerResponse.ok) {
          throw new Error("Failed to fetch seller information");
        }
  
        const seller = await sellerResponse.json();
        const sellerId = seller.items[0].seller_id;
        setSellerID(sellerId);
  
        const productResponse = await fetch(
          `http://10.233.219.18/magento2/pub/rest/V1/mpapi/admin/sellers/${sellerId}/product`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${tokena}`,
            },
          }
        );
  
        if (!productResponse.ok) {
          throw new Error("Failed to fetch products");
        }
  
        const productData = await productResponse.json();
        const sellerData = productData.search_criteria.filter_groups[0].filters[0].value;
        const productIds = sellerData.split(',');
  
        const productDetailsPromises = productIds.map(id => fetchAdditionalData(id, tokena));
        const productsData = await Promise.all(productDetailsPromises);
  
        setProducts(productsData);
        setLoading(false);
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
    };
  
    fetchProducts();
  }, [token, tokena]);
  
  const fetchAdditionalData = async (id, tokena ,token) => {
    try {
      const productResponse = await fetch(
        `http://10.233.219.18/magento2/pub/rest/all/V1/products?searchCriteria%5BfilterGroups%5D%5B0%5D%5Bfilters%5D%5B0%5D%5Bfield%5D=entity_id&searchCriteria%5BfilterGroups%5D%5B0%5D%5Bfilters%5D%5B0%5D%5Bvalue%5D=${id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokena}`,
          },
        }
      );
  
      if (!productResponse.ok) {
        throw new Error(`Failed to fetch additional data for id: ${id}`);
      }
  
      const productData = await productResponse.json();
   console.log(productData.items[0].sku) 
      const stockResponse = await fetch(
        `http://10.233.219.18/magento2/pub/rest/all/V1/stockStatuses/${productData.items[0].sku}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      if (!stockResponse.ok) {
        throw new Error(`Failed to fetch stock data for SKU: ${productData.items[0].sku}`);
      }
  
      const stockData = await stockResponse.json();
  
      return { sku: productData.items[0].sku, additionalData: productData ,stockData: stockData};
    } catch (error) {
      console.error(error);
      return null;
    }
  };
  

  const extractImageUrl = (product) => {
    if (!product.additionalData || !product.additionalData) {
      return null;
    }
    const imageAttribute = product.additionalData.items[0].custom_attributes.find(
      (attr) => attr.attribute_code === "image"
    );
    return imageAttribute
      ? `http://10.233.219.18/magento2/pub/media/catalog/product${imageAttribute.value}`
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
              extension_attributes: {
                stock_item: {
                  manage_stock: 1,
                  use_config_manage_stock: 1,
                  qty: parseInt(modalQuantity) || item.stockData.qty,
                  is_in_stock: currentIsInStock || isInStock,
                },
                category_links: [],
              },
            },
          }),
        }
      );
      const responseData = await response.json();


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
        fetchAdditionalData(item.id, token)
     
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
    color: "white",
    width: 100,
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
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => {
          const imageUrl = extractImageUrl(item);
          const isInStock = item.stockData
            ? item.stockData.stock_item.is_in_stock
            : null;
          return (
            <>
              <Modal isVisible={modalVisibleArray[index]}>
                <View style={styles.modalContainer}>
                  <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <Text style={styles.modalTitle}>{item.name}</Text>
                    <Text style={styles.label}>Prix</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Price"
                      value={modalPrice}
                      onChangeText={handlePriceChange}
                      keyboardType="numeric"
                    />
                    <Text style={styles.label}>Quantité</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Quantity"
                      value={modalQuantity}
                      onChangeText={handleQuantityChange}
                      keyboardType="numeric"
                    />
                    <Text style={styles.label}>Nom</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Name"
                      value={modalName}
                      onChangeText={handleNameChange}
                    />
                    <Text style={styles.label}>Status du Stock</Text>
                    <Dropdown
                      style={styles.dropdown}
                      data={[
                        { label: "On stock", value: true },
                        { label: "Hors Stock", value: false },
                      ]}
                      maxHeight={300}
                      labelField="label"
                      valueField="value"
                      placeholder={!isFocus ? "Sélectionner" : "..."}
                      searchPlaceholder="Rechercher..."
                      value={isInStock}
                      onFocus={() => setIsFocus(true)}
                      onBlur={() => setIsFocus(false)}
                      onChange={(item) => {
                        setIsInStock(item.value);
                        setIsFocus(false);
                      }}
                    />
                    <View style={styles.buttonContainer}>
                      <TouchableOpacity
                        style={[styles.button, styles.saveButton]}
                        onPress={() => handleUpdate(item, isInStock)}
                      >
                        <Text style={styles.buttonText}>Sauvegarder</Text>
                      </TouchableOpacity>
                      
                    </View>
                    <TouchableOpacity
                        style={[styles.button, styles.cancelButton]}
                        onPress={() => toggleModal(index)}
                      >
                        <Text style={[styles.buttonText, { color: "white" }]}>
                          Fermer
                        </Text> 
                      </TouchableOpacity>
                  </ScrollView>
                </View>
              </Modal> 

              <Card style={styles.card}>
                <Title style={styles.productTitle}>{item.additionalData.items[0].name}</Title>
                <View style={styles.productContent}>
                  <Image
                    source={{ uri: extractImageUrl(item) }}
                    style={styles.productImage}
                  />
                  <View style={styles.separator} />
                  <View style={styles.productInfo}>
                    <Paragraph style={styles.productDetails}>
                      Identifiant:{" "}
                      {item.additionalData ? item.additionalData.items[0].id : "N/A"}
                    </Paragraph>
                    <Paragraph style={styles.productDetails}>
                      Prix:{" "}
                      {item.additionalData ? item.additionalData.items[0].price : "N/A"}{" "}
                      TND
                    </Paragraph>
                    <Paragraph style={styles.productDetails}>
                      Stock: {item.stockData ? item.stockData.qty : "N/A"}
                    </Paragraph>
                    <Paragraph style={[styles.stock, getStatusStyle(isInStock)]}>
                      {isInStock ? "On stock" : "Hors Stock"}
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
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    padding: 10,
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
    textAlign: "center",
    borderRadius: 25,
    overflow: "hidden",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "white",
    padding: 20,
    margin: 20,
    borderRadius: 10,
    elevation: 5,
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  label: {
    alignSelf: "flex-start",
    paddingLeft: "10%",
    fontWeight: "bold",
    marginBottom: 5,
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
  dropdown: {
    width: "80%",
    marginBottom: 20,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderColor: "gray",
    borderWidth: 1,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  button: {
    padding: 10,
    borderRadius: 30,
    alignItems: "center",
    width: "50%",
    marginBottom:10
  },
  saveButton: {
    backgroundColor: "#007bff",
  },
  cancelButton: {
    backgroundColor: "grey",
  },
  buttonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "bold",
  },
});

export default Home;
