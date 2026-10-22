from pathlib import Path
files=[
'docs/04_业务流程与状态机.md','docs/07_领域模型与数据字典.md','docs/08_API设计规范.md','docs/11_测试验收与质量门禁.md','docs/12_需求变更与决策记录.md','docs/14_迭代计划与复盘.md','docs/19_后端接口契约准备.md','docs/21_考试闭环缺口分析与三轮收敛计划.md']
for f in files:
    p=Path(f)
    b=p.read_bytes()
    try:
        s=b.decode('utf-8')
        err='utf8-ok'
    except UnicodeDecodeError as e:
        s=b.decode('utf-8', errors='replace')
        err=f'utf8-error {e}'
    bad=s.count('\ufffd')
    moj=sum(s.count(x) for x in ['Ã','Â','å','æ','ä','ð','�'])
    print(f, len(b), err, 'replacement=', bad, 'moji-markers=', moj, 'first=', s[:60].replace('\n',' '))
