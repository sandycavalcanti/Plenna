# Como rodar o projeto

## 1 - Instalar o Node.js
https://nodejs.org/pt-br  

---

## 2 - Instalar o Expo CLI globalmente
Rodar o comando **uma vez só** em qualquer pasta (instala globalmente no computador):

```bash
npm install -g expo-cli
```

---

## 3 - Clonar o repositório

```bash
git clone https://github.com/sandycavalcanti/Plenna.git
cd Plenna
code .
```

`code .` → comando para abrir o VS Code na pasta  

---

## 4 - Instalar as dependências

```bash
npm install
```

---

## 5 - Rodar o projeto

```bash
npx expo start
```

---

# 6 - Como visualizar o app

## 6.1 - No celular

6.1.1 - Instalar o app **Expo Go** (Android ou iOS)  
6.1.2 - Escanear o QR Code que aparece no terminal/navegador  

---

## 6.2 - Emulador Android

- Abrir o Android Studio  
- Iniciar um Virtual Device  
- Após rodar `npx expo start`, pressionar: a

```bash
a
```

---

# 7 - Estrutura do Projeto

```
src/
 ├── pages/        → Telas do aplicativo
 ├── components/   → Componentes utilizáveis
 ├── routes.js     → Configuração de navegação
App.js             → Ponto de entrada da aplicação
```

---

# 8 - Dependências principais

- React Native  
- Expo  
- React Navigation (Stack + Bottom Tabs)