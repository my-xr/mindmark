import json, urllib.request
BASE='http://localhost:8080'
def api(method,path,body=None,token=None):
    data=None; headers={}
    if token: headers['Authorization']='Bearer '+token
    if body is not None:
        data=json.dumps(body,ensure_ascii=False).encode('utf-8'); headers['Content-Type']='application/json; charset=utf-8'
    req=urllib.request.Request(BASE+path,data=data,headers=headers,method=method)
    with urllib.request.urlopen(req,timeout=30) as r:
        p=json.loads(r.read().decode('utf-8'))
    if p.get('code')!='0': raise RuntimeError(p)
    return p['data']
t=api('POST','/api/v1/auth/login',{'username':'teacher@mindmark.local','password':'dev-password'})['token']
d=api('GET','/api/v1/teacher/dashboard',token=t)
print(json.dumps(d,ensure_ascii=False,indent=2))
