const fs=require('fs');
const path='apps/mindmark-web/src/components/common/SummaryStrip.vue';
let s=fs.readFileSync(path,'utf8');
s=s.replace('<script setup lang="ts">\n', '<script setup lang="ts">\nimport { computed } from \'vue\';\n\n');
s=s.replace('withDefaults(defineProps<SummaryStripProps>(), {', 'const props = withDefaults(defineProps<SummaryStripProps>(), {');
s=s.replace("  stats: () => [],\n});\n", "  stats: () => [],\n});\n\nconst normalizedStats = computed(() => props.stats ?? []);\n");
s=s.replace('v-if="stats.length"', 'v-if="normalizedStats.length"');
s=s.replace('v-for="stat in stats"', 'v-for="stat in normalizedStats"');
fs.writeFileSync(path,s,'utf8');
