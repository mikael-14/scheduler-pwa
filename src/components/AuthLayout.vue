<template>
  <div class="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950 sm:px-6 lg:px-8">
    <div class="w-full max-w-md space-y-8">
      <div class="text-center">
        <div class="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-600 text-3xl text-white shadow-lg shadow-primary-500/20">📅</div>
        <h2 class="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          <slot name="heading"></slot>
        </h2>
        <p class="mt-2 text-sm text-slate-600 dark:text-slate-400">
          <slot name="subheading"></slot>
        </p>
      </div>

      <slot></slot>
    </div>
  </div>
</template>