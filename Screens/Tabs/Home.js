import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, FlatList, Image, StyleSheet } from 'react-native';
import { Card } from 'react-native-paper';
import { FontAwesome } from '@expo/vector-icons';

const Home = ({ route }) => {
  const { token } = route.params;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://10.233.219.18/magento2/pub/rest/V1/mpapi/sellers/me/product', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch products');
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
      // console.log(sku)
      const response = await fetch(`http://10.233.219.18/magento2/pub/rest/all/V1/products/${sku}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

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

    const imageAttribute = product.additionalData.custom_attributes.find(attr => attr.attribute_code === 'image');
    console.log(imageAttribute)
    return imageAttribute ? `https://arkan.tn/media/catalog/product${imageAttribute.value}` : null;
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
    <View >
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
                <View style={{flexDirection:"row"}}>
                <View>
                <FontAwesome name="dollar" size={24} color="black" />
                <Text>Prix {item.additionalData ? item.additionalData.price : 'N/A'}</Text>
                </View>
                <View>
                <FontAwesome name="dollar" size={24} color="black" />
                <Text>Prix {item.additionalData ? item.additionalData.price : 'N/A'}</Text>
                </View>
                <View>
                <FontAwesome name="dollar" size={24} color="black" />
                <Text>Prix {item.additionalData ? item.additionalData.price : 'N/A'}</Text>
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
  card: {
    margin: 10,
    backgroundColor:"white"
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
  },
  name: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default Home;
