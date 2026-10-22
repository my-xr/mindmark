import json, urllib.request, urllib.parse
BASE='http://localhost:8080'
def api(method,path,body=None,token=None):
    data=None
    headers={}
    if token: headers['Authorization']='Bearer '+token
    if body is not None:
        data=json.dumps(body,ensure_ascii=False).encode('utf-8')
        headers['Content-Type']='application/json; charset=utf-8'
    req=urllib.request.Request(BASE+path,data=data,headers=headers,method=method)
    with urllib.request.urlopen(req,timeout=30) as r:
        payload=json.loads(r.read().decode('utf-8'))
    if payload.get('code')!='0': raise RuntimeError(payload)
    return payload['data']
tok=api('POST','/api/v1/auth/login',{'username':'teacher@mindmark.local','password':'dev-password'})['token']
page=api('GET','/api/v1/questions?keyword=Smoke&page=1&pageSize=100',token=tok)
print('found',page['total'])
for q in page['items']:
    title=q.get('title','')
    if title.startswith('Smoke'):
        res=api('DELETE','/api/v1/questions/'+urllib.parse.quote(q['id']),token=tok)
        print('deleted',q['id'],title,res.get('physicallyDeleted'),res.get('status'))
