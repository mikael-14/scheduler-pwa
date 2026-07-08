<template>
  <div class="callback-loading">
    <p>Finalizing login, please wait...</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { authApi } from '@/api/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

// The token is now handled in main.ts before this component is even mounted.
// This component's main job is now to fetch the user and redirect.
onMounted(async () => {
  if (authStore.isAuthenticated()) {
    try {
      // Request the current user's details using the token already in the store
      await authApi.getCurrentUser();
      // Redirect to home and let the router guard figure out the next step.
      // This prevents unapproved users from hitting a protected route
      // directly and seeing a blank page.
      router.push({ name: 'Home' });
    } catch (error) {
      console.error('Failed to fetch user after social login:', error);
      router.push('/login?error=social_failed');
    }
  } else {
    // This case should ideally not be hit if main.ts works correctly
    console.error('Social callback page was reached without an authenticated state.');
    router.push('/login?error=auth_error');
  }
});
</script>