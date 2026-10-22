<script setup lang="ts">
export interface AppChoiceOption {
  disabled?: boolean;
  label: string;
  value: string;
}

withDefaults(
  defineProps<{
    ariaLabel?: string;
    label?: string;
    options: AppChoiceOption[];
  }>(),
  {
    ariaLabel: '',
    label: '',
  },
);

const model = defineModel<string[]>({ required: true });

const isChecked = (value: string) => model.value.includes(value);

const toggleValue = (value: string, checked: boolean) => {
  model.value = checked
    ? [...new Set([...model.value, value])]
    : model.value.filter((item) => item !== value);
};
</script>

<template>
  <fieldset class="app-choice-chips" :aria-label="ariaLabel || label">
    <legend v-if="label" class="app-choice-chips__legend">{{ label }}</legend>
    <div class="app-choice-chips__list">
      <label v-for="option in options" :key="option.value" class="app-choice-chips__item">
        <input
          type="checkbox"
          :value="option.value"
          :checked="isChecked(option.value)"
          :disabled="option.disabled"
          @change="toggleValue(option.value, ($event.target as HTMLInputElement).checked)"
        />
        <span>{{ option.label }}</span>
      </label>
    </div>
  </fieldset>
</template>

<style scoped>
.app-choice-chips {
  min-width: 0;
  padding: 8px;
  margin: 0;
  background: color-mix(in srgb, var(--mm-color-bg) 46%, var(--mm-color-card));
  border: 1px solid color-mix(in srgb, var(--mm-color-border) 72%, transparent);
  border-radius: 8px;
}

.app-choice-chips__legend {
  padding: 0 2px;
  margin-bottom: 6px;
  color: var(--mm-color-text-tertiary);
  font-size: 11px;
  font-weight: 650;
  letter-spacing: 0.01em;
}

.app-choice-chips__list {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.app-choice-chips__item {
  position: relative;
  display: inline-flex;
  color: inherit;
  font-weight: 500;
  cursor: pointer;
}

.app-choice-chips__item input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  padding: 0;
  margin: 0;
  cursor: pointer;
  opacity: 0;
}

.app-choice-chips__item span {
  display: inline-flex;
  min-height: 28px;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  color: var(--mm-color-text-secondary);
  font-size: 12px;
  line-height: 1;
  background: var(--mm-color-card);
  border: 1px solid color-mix(in srgb, var(--mm-color-border) 86%, transparent);
  border-radius: 7px;
  box-shadow: 0 1px 2px rgb(15 23 42 / 4%);
  transition:
    color 140ms ease,
    border-color 140ms ease,
    background 140ms ease,
    box-shadow 140ms ease,
    transform 140ms ease;
}

.app-choice-chips__item span::before {
  display: inline-grid;
  width: 12px;
  height: 12px;
  place-items: center;
  color: transparent;
  font-size: 9px;
  line-height: 1;
  border: 1px solid color-mix(in srgb, var(--mm-color-border) 90%, transparent);
  border-radius: 4px;
  content: '✓';
}

.app-choice-chips__item:hover span {
  color: var(--mm-color-primary);
  border-color: color-mix(in srgb, var(--mm-color-primary) 28%, var(--mm-color-border));
  transform: translateY(-1px);
}

.app-choice-chips__item input:focus-visible + span {
  border-color: color-mix(in srgb, var(--mm-color-primary) 48%, var(--mm-color-border));
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--mm-color-primary) 11%, transparent);
}

.app-choice-chips__item input:checked + span {
  color: var(--mm-color-primary);
  background: color-mix(in srgb, var(--mm-color-primary) 9%, var(--mm-color-card));
  border-color: color-mix(in srgb, var(--mm-color-primary) 28%, var(--mm-color-border));
  box-shadow: 0 5px 12px color-mix(in srgb, var(--mm-color-primary) 8%, transparent);
}

.app-choice-chips__item input:checked + span::before {
  color: #fff;
  background: var(--mm-color-primary);
  border-color: var(--mm-color-primary);
}

.app-choice-chips__item input:disabled + span {
  cursor: not-allowed;
  opacity: 0.55;
  transform: none;
}
</style>
