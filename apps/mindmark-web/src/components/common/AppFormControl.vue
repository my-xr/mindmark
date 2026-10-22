<script setup lang="ts">
import { computed, useAttrs } from 'vue';

defineOptions({ inheritAttrs: false });

export interface AppFormOption {
  disabled?: boolean;
  label: string;
  value: number | string;
}

const props = withDefaults(
  defineProps<{
    control?: 'input' | 'select' | 'textarea';
    hideLabel?: boolean;
    hint?: string;
    label: string;
    options?: AppFormOption[];
    placeholder?: string;
    type?: 'number' | 'password' | 'search' | 'text' | 'url';
  }>(),
  {
    control: 'input',
    hideLabel: false,
    hint: '',
    options: () => [],
    placeholder: '',
    type: 'text',
  },
);

const model = defineModel<null | number | string | undefined>({ required: true });
const attrs = useAttrs();
const forwardedAttrs = computed(() => {
  const rest = { ...attrs };
  delete rest.class;

  return rest;
});
const rootClasses = computed(() => [
  'app-form-control',
  `app-form-control--${props.control}`,
  { 'app-form-control--hide-label': props.hideLabel },
  attrs.class,
]);

const normalizedValue = computed(() => model.value ?? '');

const updateInputValue = (event: Event) => {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement;
  model.value =
    props.type === 'number' && target.value !== '' ? Number(target.value) : target.value;
};

const updateSelectValue = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  model.value = target.value;
};
</script>

<template>
  <label :class="rootClasses">
    <span class="app-form-control__label">{{ label }}</span>
    <select
      v-if="control === 'select'"
      v-bind="forwardedAttrs"
      class="app-form-control__input app-form-control__select"
      :value="normalizedValue"
      @change="updateSelectValue"
    >
      <option
        v-for="option in options"
        :key="String(option.value)"
        :value="option.value"
        :disabled="option.disabled"
      >
        {{ option.label }}
      </option>
    </select>
    <textarea
      v-else-if="control === 'textarea'"
      v-bind="forwardedAttrs"
      class="app-form-control__input app-form-control__textarea"
      :value="normalizedValue"
      :placeholder="placeholder"
      @input="updateInputValue"
    />
    <input
      v-else
      v-bind="forwardedAttrs"
      class="app-form-control__input"
      :type="type"
      :value="normalizedValue"
      :placeholder="placeholder"
      @input="updateInputValue"
    />
    <small v-if="hint" class="app-form-control__hint">{{ hint }}</small>
  </label>
</template>

<style scoped>
.app-form-control {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.app-form-control__label {
  color: var(--mm-color-text-tertiary);
  font-size: 11px;
  font-weight: 650;
  letter-spacing: 0.01em;
  line-height: 1.2;
}

.app-form-control--hide-label .app-form-control__label {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.app-form-control__input {
  width: 100%;
  min-height: 36px;
  padding: 0 12px;
  color: var(--mm-color-text);
  font: inherit;
  font-size: 13px;
  background:
    linear-gradient(180deg, rgb(255 255 255 / 52%), transparent),
    color-mix(in srgb, var(--mm-color-bg) 54%, var(--mm-color-card));
  border: 1px solid color-mix(in srgb, var(--mm-color-border) 88%, transparent);
  border-radius: 7px;
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 45%);
  outline: none;
  transition:
    border-color 140ms ease,
    box-shadow 140ms ease,
    background 140ms ease;
}

.app-form-control__textarea {
  min-height: 84px;
  padding-top: 10px;
  padding-bottom: 10px;
  line-height: 1.55;
  resize: vertical;
}

[data-theme='dark'] .app-form-control__input {
  background: color-mix(in srgb, var(--mm-color-bg) 62%, var(--mm-color-card));
  box-shadow: none;
}

.app-form-control__select {
  padding-right: 32px;
  appearance: none;
  background-image:
    linear-gradient(45deg, transparent 50%, var(--mm-color-text-tertiary) 50%),
    linear-gradient(135deg, var(--mm-color-text-tertiary) 50%, transparent 50%),
    linear-gradient(180deg, rgb(255 255 255 / 52%), transparent);
  background-position:
    calc(100% - 16px) 50%,
    calc(100% - 11px) 50%,
    0 0;
  background-size:
    5px 5px,
    5px 5px,
    100% 100%;
  background-repeat: no-repeat;
}

.app-form-control__input:hover {
  background-color: var(--mm-color-card);
  border-color: color-mix(in srgb, var(--mm-color-primary) 24%, var(--mm-color-border));
}

.app-form-control__input:focus {
  border-color: color-mix(in srgb, var(--mm-color-primary) 56%, var(--mm-color-border));
  box-shadow:
    0 0 0 2px color-mix(in srgb, var(--mm-color-primary) 10%, transparent),
    inset 0 1px 0 rgb(255 255 255 / 46%);
}

.app-form-control__hint {
  overflow: hidden;
  color: var(--mm-color-text-tertiary);
  font-size: 11px;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
