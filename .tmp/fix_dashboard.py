from pathlib import Path
p=Path('apps/mindmark-web/src/views/teacher/DashboardView.vue')
s=p.read_text(encoding='utf-8')
s=s.replace('''      <article v-if="loading && !metrics.length" v-for="index in 4" :key="index" class="metric-card">
        <span>加载中</span>
        <strong>...</strong>
        <small>正在读取真实业务数据</small>
      </article>''','''      <template v-if="loading && !metrics.length">
        <article v-for="index in 4" :key="index" class="metric-card">
          <span>加载中</span>
          <strong>...</strong>
          <small>正在读取真实业务数据</small>
        </article>
      </template>''')
p.write_text(s, encoding='utf-8', newline='\n')
