<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { RouterLink, type RouteLocationRaw } from 'vue-router';

import { useAppStore } from '@/stores/appStore';

defineOptions({ inheritAttrs: false });

const attrs = useAttrs();
const appStore = useAppStore();

const hasClassName = (value: unknown, className: string): boolean => {
  if (typeof value === 'string') {
    return value.split(/\s+/).includes(className);
  }

  if (Array.isArray(value)) {
    return value.some((item) => hasClassName(item, className));
  }

  if (value && typeof value === 'object') {
    return Boolean((value as Record<string, unknown>)[className]);
  }

  return false;
};

const props = withDefaults(
  defineProps<{
    ariaLabel?: string;
    disabled?: boolean;
    htmlType?: 'button' | 'submit' | 'reset';
    icon?: string;
    iconOnly?: boolean;
    loading?: boolean;
    size?: 'sm' | 'md';
    title?: string;
    to?: RouteLocationRaw | undefined;
    variant?: 'primary' | 'secondary' | 'danger' | 'tag' | 'tag-danger';
  }>(),
  {
    ariaLabel: '',
    disabled: false,
    htmlType: 'button',
    icon: '',
    iconOnly: false,
    loading: false,
    size: 'md',
    title: '',
    to: undefined,
    variant: 'secondary',
  },
);

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const isLink = computed(() => Boolean(props.to && !props.disabled));
const forwardedAttrs = computed(() => {
  const rest = { ...attrs };
  delete rest.class;

  return rest;
});

const isIconActionButton = computed(() => hasClassName(attrs.class, 'icon-action-button'));

const classes = computed(() => [
  'app-action-button',
  `app-action-button--${props.variant}`,
  `app-action-button--${props.size}`,
  {
    'app-action-button--disabled': props.disabled,
    'app-action-button--loading': props.loading,
    'app-action-button--icon-action': isIconActionButton.value,
    [`app-action-button--action-${appStore.actionButtonMode}`]: isIconActionButton.value,
    [`app-action-button--weight-${appStore.actionButtonWeight}`]: true,
  },
]);
const rootClasses = computed(() => [classes.value, attrs.class]);
const iconText = computed(() => (props.loading ? '⏳' : props.icon));

const handleClick = (event: MouseEvent) => {
  if (props.disabled || props.loading) {
    event.preventDefault();
    return;
  }

  emit('click', event);
};
</script>

<template>
  <RouterLink
    v-if="isLink"
    v-bind="forwardedAttrs"
    :class="rootClasses"
    :to="to!"
    :title="title || ariaLabel"
    :aria-label="ariaLabel"
    @click="handleClick"
  >
    <span v-if="iconText" class="app-action-button__icon">{{ iconText }}</span>
    <span v-if="!iconOnly" class="app-action-button__label"><slot /></span>
  </RouterLink>
  <button
    v-else
    v-bind="forwardedAttrs"
    :class="rootClasses"
    :type="htmlType"
    :disabled="disabled || loading"
    :title="title || ariaLabel"
    :aria-label="ariaLabel"
    @click="handleClick"
  >
    <span v-if="iconText" class="app-action-button__icon">{{ iconText }}</span>
    <span v-if="!iconOnly" class="app-action-button__label"><slot /></span>
  </button>
</template>

<style scoped>
.app-action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: 999px;
  cursor: pointer;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.01em;
  line-height: 1;
  text-decoration: none;
  box-sizing: border-box;
  appearance: none;
  white-space: nowrap;
  transition:
    border-color 140ms ease,
    box-shadow 140ms ease,
    transform 140ms ease,
    background 140ms ease,
    color 140ms ease;
}

.app-action-button--sm {
  min-height: 28px;
  gap: 5px;
  padding: 0 9px;
}

.app-action-button--md {
  min-height: 32px;
  gap: 6px;
  padding: 0 11px;
}

.app-action-button__label {
  font-size: 12px;
  font-weight: inherit;
  line-height: 1;
}

.app-action-button--weight-bold {
  font-weight: 600;
}

.app-action-button--weight-regular {
  font-weight: 400;
}

.app-action-button__icon {
  display: inline-grid;
  width: 15px;
  height: 15px;
  place-items: center;
  border-radius: 999px;
  font-size: 12px;
  line-height: 1;
}

.app-action-button--icon-action,
.app-action-button--action-expanded {
  width: auto;
  min-width: 30px;
  max-width: none;
  height: auto;
  min-height: 30px;
  flex: 0 1 auto;
  gap: 6px;
  padding-inline: 8px;
  overflow: hidden;
  border-radius: 999px;
  white-space: nowrap;
  aspect-ratio: auto;
}

.app-action-button--icon-action .app-action-button__icon,
.app-action-button--action-expanded .app-action-button__icon {
  width: 15px;
  flex: 0 0 15px;
  font-size: 12px;
}

.app-action-button--icon-action .app-action-button__label,
.app-action-button--action-expanded .app-action-button__label {
  display: inline-block;
  max-width: none;
  overflow: visible;
  opacity: 1;
}

.app-action-button--action-compact {
  position: relative;
  width: 30px;
  min-width: 30px;
  max-width: 30px;
  height: 30px;
  min-height: 30px;
  flex: 0 0 30px;
  gap: 0;
  padding-inline: 0;
  overflow: visible;
  border-radius: 999px;
  aspect-ratio: 1 / 1;
}

.app-action-button--action-compact .app-action-button__label {
  position: absolute;
  top: 50%;
  right: calc(100% + 8px);
  z-index: 20;
  display: inline-flex;
  width: max-content;
  max-width: 160px;
  min-height: 28px;
  align-items: center;
  padding: 0 9px;
  overflow: hidden;
  color: var(--mm-color-primary);
  pointer-events: none;
  background: var(--mm-color-card);
  border: 1px solid color-mix(in srgb, var(--mm-color-primary) 18%, var(--mm-color-border));
  border-radius: 999px;
  box-shadow: 0 8px 18px rgb(15 23 42 / 10%);
  opacity: 0;
  transform: translateY(-50%) translateX(4px);
  transition:
    opacity 120ms ease,
    transform 120ms ease;
}

.app-action-button--action-compact:hover .app-action-button__label,
.app-action-button--action-compact:focus-visible .app-action-button__label {
  opacity: 1;
  transform: translateY(-50%) translateX(0);
}

.app-action-button--secondary {
  border-color: color-mix(in srgb, var(--mm-color-primary) 18%, var(--mm-color-border));
  color: var(--mm-color-primary);
  background: color-mix(in srgb, var(--mm-color-primary) 6%, var(--mm-color-card));
}

.app-action-button--secondary .app-action-button__icon {
  background: color-mix(in srgb, var(--mm-color-primary) 12%, transparent);
}

.app-action-button--secondary:hover,
.app-action-button--secondary:focus-visible {
  border-color: color-mix(in srgb, var(--mm-color-primary) 34%, var(--mm-color-border));
  color: var(--mm-color-primary);
  background: color-mix(in srgb, var(--mm-color-primary) 10%, var(--mm-color-card));
  box-shadow: 0 8px 18px color-mix(in srgb, var(--mm-color-primary) 12%, transparent);
  transform: translateY(-1px);
}

.app-action-button--danger {
  border-color: color-mix(in srgb, var(--mm-color-danger) 22%, var(--mm-color-border));
  color: var(--mm-color-danger);
  background: color-mix(in srgb, var(--mm-color-danger) 7%, var(--mm-color-card));
}

.app-action-button--danger .app-action-button__icon {
  background: color-mix(in srgb, var(--mm-color-danger) 12%, transparent);
}

.app-action-button--danger:hover,
.app-action-button--danger:focus-visible {
  border-color: color-mix(in srgb, var(--mm-color-danger) 38%, var(--mm-color-border));
  color: var(--mm-color-danger);
  background: color-mix(in srgb, var(--mm-color-danger) 11%, var(--mm-color-card));
  box-shadow: 0 8px 18px color-mix(in srgb, var(--mm-color-danger) 12%, transparent);
  transform: translateY(-1px);
}

.app-action-button--primary {
  border: 0;
  color: #fff;
  background: linear-gradient(
    135deg,
    var(--mm-color-primary),
    color-mix(in srgb, var(--mm-color-primary) 72%, #4f46e5)
  );
  box-shadow: 0 10px 22px color-mix(in srgb, var(--mm-color-primary) 20%, transparent);
}

.app-action-button--primary .app-action-button__icon {
  color: var(--mm-color-primary);
  background: rgb(255 255 255 / 92%);
}

.app-action-button--primary:hover,
.app-action-button--primary:focus-visible {
  color: #fff;
  box-shadow: 0 12px 26px color-mix(in srgb, var(--mm-color-primary) 26%, transparent);
  transform: translateY(-1px);
}

.app-action-button--tag,
.app-action-button--tag-danger {
  min-width: auto;
  min-height: 24px;
  padding: 0 8px;
}

.app-action-button--tag {
  border-color: color-mix(in srgb, var(--mm-color-primary) 18%, var(--mm-color-border));
  color: var(--mm-color-primary);
  background: color-mix(in srgb, var(--mm-color-primary) 7%, var(--mm-color-card));
}

.app-action-button--tag-danger {
  width: 26px;
  padding: 0;
  border-color: color-mix(in srgb, var(--mm-color-danger) 22%, var(--mm-color-border));
  color: var(--mm-color-danger);
  background: color-mix(in srgb, var(--mm-color-danger) 7%, var(--mm-color-card));
}

.app-action-button--tag:hover,
.app-action-button--tag:focus-visible {
  border-color: color-mix(in srgb, var(--mm-color-primary) 34%, var(--mm-color-border));
  background: color-mix(in srgb, var(--mm-color-primary) 11%, var(--mm-color-card));
  box-shadow: 0 6px 14px color-mix(in srgb, var(--mm-color-primary) 12%, transparent);
  transform: translateY(-1px);
}

.app-action-button--tag-danger:hover,
.app-action-button--tag-danger:focus-visible {
  border-color: color-mix(in srgb, var(--mm-color-danger) 38%, var(--mm-color-border));
  background: color-mix(in srgb, var(--mm-color-danger) 11%, var(--mm-color-card));
  box-shadow: 0 6px 14px color-mix(in srgb, var(--mm-color-danger) 12%, transparent);
  transform: translateY(-1px);
}

.app-action-button--disabled,
.app-action-button:disabled {
  cursor: not-allowed;
  opacity: 0.68;
  transform: none;
}

.app-action-button--loading,
.app-action-button--loading:hover,
.app-action-button--loading:focus-visible {
  cursor: wait;
  opacity: 0.72;
  transform: none;
}
</style>
