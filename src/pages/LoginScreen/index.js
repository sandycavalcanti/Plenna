import React from 'react';
import { styles } from './styles';
import { Text, Image, KeyboardAvoidingView, TouchableOpacity, View } from 'react-native';
import CustomTextInput from '../../components/CustomTextInput';
import CustomButton from '../../components/CustomButton';

// Tela de Login
// Após clicar em "Login", o usuário é direcionado para a área principal (Tabs)
export default function LoginScreen({ navigation }) {

    // Função chamada ao clicar no botão
    function handleLogin() {
        // replace impede voltar para a tela de login
        navigation.replace('App');
    }
    function handleForgotPassword() {
        navigation.navigate('ForgotPassword');
    }
    function handleSignUp() {
        navigation.navigate('SignUp');
    }

    return (
        <KeyboardAvoidingView style={styles.container} behavior="padding">
            <Image source={require('../../../assets/img/logoPlennaIcon.png')} style={styles.logo} />
            <Text style={styles.titulo}> Bem-vindo! </Text>
            <View style={styles.overlay}> 
                <CustomTextInput placeholder="Email"/>
                <CustomTextInput placeholder="Senha" secureTextEntry/>
                <Text style={[styles.texto, { color: '#a31414', alignSelf: 'flex-end', marginBottom: 30, paddingRight: 10, marginTop: -10 }]} onPress={handleForgotPassword}>
                Esqueci minha senha
                </Text>
                <CustomButton title="Entrar" onPress={handleLogin} />

              <Text style={[styles.texto, { color: 'rgba(89, 93, 124, 0.69)' }]} onPress={handleSignUp}>
                  Criar conta
              </Text>            
            </View>
        </KeyboardAvoidingView>
    );
}