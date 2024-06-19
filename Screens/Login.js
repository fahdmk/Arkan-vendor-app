import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Button from "../components/Button";
import COLORS from "../constants/colors";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Login = ({ navigation }) => {
  const [isPasswordShown, setIsPasswordShown] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [idtab, setIdtab] = useState("");
  const [token, setToken] = useState("");
  const handleLogin = async () => {
    console.log(config.ip);
    const ip = config.ip;
    try {
      const response = await fetch(`https://10.233.219.18/magento2/pub/rest/all/V1/integration/admin/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Login failed");
      }

      const { token, user } = await response.json();
      setRole(user.role);
      setEmail("");
      setPassword("");

      
      await AsyncStorage.setItem("user", user.fullName);
      navigation.reset({
        index: 0,
        routes: [
          { name: "Tabs" },
        ],
      });
    } catch (error) {
      console.error("Login error:", error.message);
      Alert.alert("Error", "Invalid credentials. Please try again.");
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
        <ScrollView>
          <View style={{ flex: 1, marginHorizontal: 22 }}>
            <View style={{ marginVertical: 50, alignItems: "center" }}>
              <Image
                source={require("../assets/Logo.png")}
                resizeMode="contain"
                style={{
                  width: "90%",
                  height: 140,
                }}
              />
            </View>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                marginVertical: 12,
                color: COLORS.black,
              }}
            >
              Se connecter
            </Text>
            <View style={{ marginBottom: 12 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: 400,
                  marginVertical: 8,
                }}
              >
                Address Email
              </Text>

              <View
                style={{
                  width: "100%",
                  height: 48,
                  borderColor: COLORS.black,
                  borderWidth: 1,
                  borderRadius: 8,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingLeft: 22,
                }}
              >
                <TextInput
                  placeholder="Enter your email address"
                  placeholderTextColor={COLORS.black}
                  keyboardType="email-address"
                  style={{
                    width: "100%",
                  }}
                  value={email}
                  onChangeText={(text) => setEmail(text)}
                />
              </View>
            </View>

            <View style={{ marginBottom: 12 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: 400,
                  marginVertical: 8,
                }}
              >
                Mot de pass
              </Text>

              <View
                style={{
                  width: "100%",
                  height: 48,
                  borderColor: COLORS.black,
                  borderWidth: 1,
                  borderRadius: 8,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingLeft: 22,
                }}
              >
                <TextInput
                  placeholder="Enter your password"
                  placeholderTextColor={COLORS.black}
                  secureTextEntry={isPasswordShown}
                  style={{
                    width: "100%",
                  }}
                  value={password}
                  onChangeText={(text) => setPassword(text)}
                />

                <TouchableOpacity
                  onPress={() => setIsPasswordShown(!isPasswordShown)}
                  style={{
                    position: "absolute",
                    right: 12,
                  }}
                >
                  {isPasswordShown == true ? (
                    <Ionicons name="eye-off" size={24} color={COLORS.black} />
                  ) : (
                    <Ionicons name="eye" size={24} color={COLORS.black} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <Button
              title="Login"
              filled
              onPress={handleLogin}
              style={{
                marginTop: 18,
                marginBottom: 4,
                backgroundColor: "#5EB22C",
              }}
            />

          </View>
        </ScrollView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default Login;