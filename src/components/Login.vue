<template>
  <div class="login-outer">
    <div class="login-box">
      <form @submit.prevent="handleSubmit" class="login-form" v-if="showForm">
        <h2>Login</h2>

        <div class="form-group">
          <input v-model="username" type="text" placeholder="Username" required />
        </div>

        <div class="form-group">
          <input
            v-model="password"
            type="password"
            placeholder="Password"
            required
          />
        </div>

        <button type="submit">Login</button>
      </form>
      <div class="social-login">
        <button type="button" @click="loginWithUser">Login with username</button>
        <button type="button" @click="loginWithFacebook">
          Login with Facebook
        </button>
        <button type="button" @click="loginWithGoogle">Login with Google</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { authService } from "../services/auth";

export default defineComponent({
  name: "Login",
  data() {
    return {
      error: null,
    };
  },
  setup() {
    const username = ref("");
    const password = ref("");
    const showForm = ref(false); // property to control form visibility

    const handleSubmit = async () => {
      try {
        await authService.login({
          username: username.value,
          password: password.value,
        });
        // Redirect to dashboard after successful login
      } catch (error) {
        console.error("Login failed:", error);
      }
    };

    const loginWithUser = () => {
      showForm.value = !showForm.value; // method to toggle form
    };

    const loginWithFacebook = async () => {
      // Implement Facebook OAuth login
    };

    const loginWithGoogle = async () => {
      // Implement Google OAuth login
    };

    return {
      username,
      password,
      showForm,
      handleSubmit,
      loginWithUser,
      loginWithFacebook,
      loginWithGoogle,
    };
  },
});
</script>

<style scoped>
.login-outer {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: #f7f7f7;
}

.login-box {
  width: 340px;
  padding: 30px 24px;
  border-radius: 12px;
  box-shadow: 0 0 16px rgba(0, 0, 0, 0.12);
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.login-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.login-form h2 {
  margin-bottom: 18px;
}

.form-group {
  width: 100%;
  margin-bottom: 15px;
}

input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}

button {
  width: 100%;
  padding: 10px;
  background-color: #4dba87;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 10px;
  font-size: 16px;
  transition: background 0.2s;
}

button:last-child {
  margin-bottom: 0;
}

button:hover {
  background-color: #3a9e6d;
}

.social-login {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 10px;
}

.social-login button {
  margin-bottom: 10px;
}

.social-login button:last-child {
  margin-bottom: 0;
}
</style>