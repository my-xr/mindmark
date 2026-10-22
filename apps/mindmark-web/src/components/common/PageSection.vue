<script setup lang="ts">
defineOptions({ inheritAttrs: false });

interface PageSectionProps {
  title?: string;
  description?: string;
  headerClass?: string;
  divided?: boolean;
}

withDefaults(defineProps<PageSectionProps>(), {
  title: '',
  description: '',
  headerClass: '',
  divided: true,
});
</script>

<template>
  <section
    v-bind="$attrs"
    :class="['content-card', 'page-section', { 'page-section--divided': divided }]"
  >
    <div
      v-if="title || description || $slots.title || $slots.actions"
      :class="['section-title', 'page-section-title', headerClass]"
    >
      <div class="page-section-title__main">
        <slot name="title">
          <h2 v-if="title">{{ title }}</h2>
          <p v-if="description" class="muted-text">{{ description }}</p>
        </slot>
      </div>
      <div v-if="$slots.actions" class="page-section-title__actions">
        <slot name="actions" />
      </div>
    </div>
    <slot />
  </section>
</template>
