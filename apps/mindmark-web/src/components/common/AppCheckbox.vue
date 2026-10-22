<script setup lang="ts">
withDefaults(
  defineProps<{
    disabled?: boolean;
    label: string;
  }>(),
  {
    disabled: false,
  },
);

const model = defineModel<boolean>({ required: true });
</script>

<template>
  <label class="app-checkbox" :class="{ 'app-checkbox--disabled': disabled }">
    <input v-model="model" type="checkbox" :disabled="disabled" />
    <span class="app-checkbox__box" aria-hidden="true">✓</span>
    <span class="app-checkbox__label">{{ label }}</span>
  </label>
</template>

<style scoped>
.app-checkbox {
  display: inline-flex;
  min-height: 36px;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  color: var(--mm-color-text-secondary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  background: color-mix(in srgb, var(--mm-color-bg) 54%, var(--mm-color-card));
  border: 1px solid color-mix(in srgb, var(--mm-color-border) 84%, transparent);
  border-radius: 7px;
  transition:
    color 140ms ease,
    border-color 140ms ease,
    background 140ms ease,
    box-shadow 140ms ease;
}

.app-checkbox input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}

.app-checkbox__box {
  display: inline-grid;
  width: 14px;
  height: 14px;
  place-items: center;
  color: transparent;
  font-size: 10px;
  line-height: 1;
  background: var(--mm-color-card);
  border: 1px solid color-mix(in srgb, var(--mm-color-border) 90%, transparent);
  border-radius: 4px;
}

.app-checkbox:hover {
  color: var(--mm-color-primary);
  border-color: color-mix(in srgb, var(--mm-color-primary) 28%, var(--mm-color-border));
}

.app-checkbox input:focus-visible + .app-checkbox__box {
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--mm-color-primary) 12%, transparent);
}

.app-checkbox input:checked + .app-checkbox__box {
  color: #fff;
  background: var(--mm-color-primary);
  border-color: var(--mm-color-primary);
}

.app-checkbox--disabled {
  cursor: not-allowed;
  opacity: 0.58;
}
</style>
