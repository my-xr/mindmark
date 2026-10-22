const base='http://localhost:18083';
async function post(path, body, token){
 const r=await fetch(base+path,{method:'POST',headers:{'content-type':'application/json; charset=utf-8',...(token?{authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});return r.json();
}
async function get(path, token){ const r=await fetch(base+path,{headers:{authorization:'Bearer '+token}}); return r.json(); }
(async()=>{
 const login=await post('/api/v1/auth/login',{username:'teacher@mindmark.local',password:'dev-password'});
 const token=login.data.token;
 const courses=await get('/api/v1/courses?page=1&pageSize=10', token).catch(e=>null);
 console.log(JSON.stringify(courses?.data?.items?.slice(0,3).map(c=>({id:c.id,name:c.name,hasCjk:/[\u4e00-\u9fff]/.test(c.name),hasQuestionMarks:c.name.includes('?')})), null, 2));
 const qs=await get('/api/v1/questions?page=1&pageSize=5&courseId=course-9833f525-4607-494a-92cf-37cb21b6f2b3',token);
 console.log(JSON.stringify(qs.data.items.map(q=>({title:q.title,hasCjk:/[\u4e00-\u9fff]/.test(q.title),hasQuestionMarks:q.title.includes('?')})),null,2));
})().catch(e=>{console.error(e);process.exit(1)});