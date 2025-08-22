<template>
  <div id="app">
    <Login v-if="!isAuthenticated" />
    <div v-else>
      <header>
        <h1>PWA Scheduler</h1>
        <button @click="logout">Logout</button>
      </header>
      <!-- Your scheduler content here -->
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue'
import Login from './components/Login.vue'
import { authService } from './services/auth'

export default defineComponent({
  name: 'App',
  components: {
    Login
  },
  setup() {
    const isAuthenticated = ref(false);

    onMounted(() => {
      isAuthenticated.value = authService.isAuthenticated();
    });

    const logout = () => {
      authService.logout();
      isAuthenticated.value = false;
    };

    return {
      isAuthenticated,
      logout
    }
  }
})
</script>