&lt;template&gt;
  &lt;div class=&quot;login-container&quot;&gt;
    &lt;div class=&quot;login-card&quot;&gt;
      &lt;img :src=&quot;schoolLogo || '/images/default-logo.png'&quot; alt=&quot;School Logo&quot; class=&quot;school-logo&quot;&gt;
      &lt;h2&gt;Welcome Back&lt;/h2&gt;
      &lt;form @submit.prevent=&quot;handleLogin&quot; class=&quot;login-form&quot;&gt;
        &lt;div class=&quot;form-group&quot;&gt;
          &lt;input type=&quot;email&quot; v-model=&quot;email&quot; placeholder=&quot;Email&quot; required&gt;
        &lt;/div&gt;
        &lt;div class=&quot;form-group&quot;&gt;
          &lt;input type=&quot;password&quot; v-model=&quot;password&quot; placeholder=&quot;Password&quot; required&gt;
        &lt;/div&gt;
        &lt;div class=&quot;biometric-auth&quot;&gt;
          &lt;button type=&quot;button&quot; @click=&quot;handleBiometricAuth&quot; class=&quot;face-id-button&quot;&gt;
            &lt;span class=&quot;face-id-icon&quot;&gt;😊&lt;/span&gt; Use Face ID
          &lt;/button&gt;
        &lt;/div&gt;
        &lt;button type=&quot;submit&quot; class=&quot;login-button&quot;&gt;Log In&lt;/button&gt;
      &lt;/form&gt;
    &lt;/div&gt;
  &lt;/div&gt;
&lt;/template&gt;

&lt;script&gt;
export default {
  name: 'LoginPage',
  data() {
    return {
      email: '',
      password: '',
      schoolLogo: null // Will be populated from university data
    }
  },
  methods: {
    handleLogin() {
      // To be implemented with backend integration
      console.log('Login attempted')
    },
    handleBiometricAuth() {
      // To be implemented with native biometric integration
      console.log('Biometric auth requested')
    }
  }
}
&lt;/script&gt;

&lt;style scoped&gt;
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
}

.login-card {
  background: white;
  padding: 40px;
  border-radius: 20px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  text-align: center;
  transition: transform 0.3s ease;
}

.login-card:hover {
  transform: translateY(-5px);
}

.school-logo {
  width: 120px;
  height: 120px;
  object-fit: contain;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
}

input {
  width: 100%;
  padding: 12px;
  border: 2px solid #eee;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s ease;
}

input:focus {
  border-color: #2c3e50;
  outline: none;
}

.login-button {
  width: 100%;
  padding: 12px;
  background: #2c3e50;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.login-button:hover {
  background: #34495e;
}

.biometric-auth {
  margin: 20px 0;
}

.face-id-button {
  background: none;
  border: none;
  color: #2c3e50;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 10px;
  font-size: 16px;
  transition: color 0.3s ease;
}

.face-id-button:hover {
  color: #34495e;
}

.face-id-icon {
  font-size: 24px;
  margin-right: 8px;
}
&lt;/style&gt;
