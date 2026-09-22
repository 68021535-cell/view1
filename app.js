
const DB={
 get users(){return JSON.parse(localStorage.getItem('lung_users')||'[]')},
 set users(v){localStorage.setItem('lung_users',JSON.stringify(v))},
 get me(){return JSON.parse(localStorage.getItem('lung_me')||'null')},
 set me(v){v?localStorage.setItem('lung_me',JSON.stringify(v)):localStorage.removeItem('lung_me')}
};
function guard(){ if(!DB.me){location.href='login.html';return false} 
 document.querySelectorAll('[data-me]').forEach(e=>e.textContent=DB.me.name);
 document.querySelectorAll('[data-role]').forEach(e=>e.textContent=DB.me.role);
 document.querySelectorAll('[data-initial]').forEach(e=>e.textContent=DB.me.name.charAt(0).toUpperCase());
 return true}
function logout(){ if(confirm('ออกจากระบบใช่ไหม')){DB.me=null;location.href='login.html'} }
function doRegister(e){e.preventDefault();
 const f=e.target,m=document.getElementById('msg');
 const name=f.name_.value.trim(),email=f.email.value.trim().toLowerCase(),p=f.pass.value,p2=f.pass2.value;
 if(p.length<6){m.className='msg err';m.textContent='รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร';return}
 if(p!==p2){m.className='msg err';m.textContent='รหัสผ่านทั้งสองช่องไม่ตรงกัน';return}
 const us=DB.users;
 if(us.some(u=>u.email===email)){m.className='msg err';m.textContent='อีเมลนี้ถูกใช้สมัครแล้ว ลองเข้าสู่ระบบแทน';return}
 us.push({name,email,pass:p,role:f.role.value}); DB.users=us;
 m.className='msg ok';m.textContent='สมัครสมาชิกสำเร็จ กำลังพาไปหน้าเข้าสู่ระบบ';
 setTimeout(()=>location.href='login.html',900);}
function doLogin(e){e.preventDefault();
 const f=e.target,m=document.getElementById('msg');
 const email=f.email.value.trim().toLowerCase(),p=f.pass.value;
 const u=DB.users.find(u=>u.email===email&&u.pass===p);
 if(!u){m.className='msg err';m.textContent='อีเมลหรือรหัสผ่านไม่ถูกต้อง';return}
 DB.me={name:u.name,email:u.email,role:u.role}; location.href='dashboard.html';}
function go(url){location.href=url}
function pickPatient(id){localStorage.setItem('lung_patient',id);location.href='segmentation.html'}
function currentPatient(){return localStorage.getItem('lung_patient')||'P001'}
function fakeUpload(input){
 const n=input.files[0]?input.files[0].name:'';
 if(!n)return; document.getElementById('upinfo').textContent='เลือกไฟล์แล้ว: '+n;
 document.getElementById('upgo').disabled=false;}

/* ---------- upload states ---------- */
let picked=null;
function onPick(input){
  const f=input.files[0]; if(!f) return;
  picked=f; hideErr();
  document.getElementById('zone').className='drop ready';
  document.getElementById('zoneBody').innerHTML=
    '<div style="font-size:34px">📄</div><div style="margin:10px 0 4px;color:#166534;font-weight:600">'+f.name+'</div>'+
    '<div style="font-size:13px">ขนาด '+(f.size/1048576).toFixed(2)+' MB — คลิกอีกครั้งเพื่อเปลี่ยนไฟล์</div>';
}
function showErr(msg){const a=document.getElementById('err');a.className='alert';
  a.innerHTML='<span>⚠️</span><span>'+msg+'</span>';
  document.getElementById('zone').classList.add('err');}
function hideErr(){document.getElementById('err').className='alert hide';
  document.getElementById('zone').classList.remove('err');}

function openConfirm(){
  if(!picked){ showErr('ยังไม่ได้เลือกไฟล์ CT กรุณาเลือกไฟล์ DICOM (.dcm) หรือไฟล์ภาพก่อนกดยืนยัน'); return; }
  const pid=document.getElementById('pid').value.trim();
  if(!pid){ showErr('กรุณากรอก Patient ID ก่อนเริ่มอัปโหลด'); return; }
  hideErr();
  document.getElementById('mFile').textContent=picked.name;
  document.getElementById('mPid').textContent=pid;
  document.getElementById('modalBg').classList.remove('hide');
}
function closeConfirm(){ document.getElementById('modalBg').classList.add('hide'); }
function confirmUpload(){
  document.getElementById('modalBg').classList.add('hide');
  document.getElementById('form').style.display='none';
  const box=document.getElementById('loading'); box.style.display='block';
  const bar=document.getElementById('bar'), pct=document.getElementById('pct');
  const li=box.querySelectorAll('.steps li');
  let p=0, stage=0;
  const timer=setInterval(()=>{
    p=Math.min(100,p+Math.random()*9+3);
    bar.style.width=p+'%'; pct.textContent=Math.floor(p)+'%';
    const s=p<35?0:p<70?1:p<100?2:3;
    if(s!==stage){stage=s; li.forEach((el,i)=>el.className=i<stage?'done':i===stage?'now':'');}
    if(p>=100){clearInterval(timer);
      li.forEach(el=>el.className='done');
      localStorage.setItem('lung_patient',pid);
      setTimeout(()=>{
        box.style.display='none';
        document.getElementById('sPid').textContent=pid;
        document.getElementById('success').style.display='block';
      },700);}
  },320);
}
function cancelUpload(){location.reload()}

/* ---------- report data ---------- */
const REPORTS={
 P001:{date:'2025-05-10',found:true,loc:'Right Lower Lobe',size:'2.4 × 2.1 × 1.8',vol:'4.32',conf:'92%'},
 P002:{date:'2025-05-09',found:true,loc:'Left Upper Lobe',size:'1.8 × 1.5 × 1.2',vol:'1.70',conf:'88%'},
 P003:{date:'2025-05-08',found:false,note:'ระบบวิเคราะห์ครบทุก slice แล้ว ไม่พบบริเวณที่เข้าข่ายก้อนเนื้อ'},
 P004:{date:'2025-05-07',pending:true}
};
function renderReport(id){
  localStorage.setItem('lung_patient',id);
  const r=REPORTS[id], body=document.getElementById('rbody'), head=document.getElementById('rhead');
  head.innerHTML='<div class="row" style="border:0;padding:4px 0"><span>Patient ID&nbsp;:&nbsp;</span><b>'+id+'</b></div>'+
   '<div class="row" style="border:0;padding:4px 0"><span>วันที่ตรวจ&nbsp;:&nbsp;</span><b>'+r.date+'</b></div>'+
   '<div class="row" style="border:0;padding:4px 0"><span>ผลการวิเคราะห์&nbsp;:&nbsp;</span><b style="color:'+
   (r.pending?'#d97706':r.found?'#dc2626':'#16a34a')+'">'+(r.pending?'รอประมวลผล':r.found?'พบก้อนเนื้อ':'ไม่พบก้อนเนื้อ')+'</b></div>';
  document.getElementById('pdfBtn').disabled=!!r.pending;
  if(r.pending){ body.innerHTML='<div class="empty"><div class="big">⏳</div><h3>ยังไม่มีรายงานสำหรับผู้ป่วยรายนี้</h3>'+
    '<p>ไฟล์ CT ของ '+id+' อัปโหลดเข้าระบบแล้วแต่ยังไม่ได้ผ่านการวิเคราะห์ เริ่มวิเคราะห์เพื่อสร้างรายงาน</p>'+
    '<button class="btn" onclick="go(\'segmentation.html\')">เริ่มวิเคราะห์ก้อนเนื้อ</button></div>'; return; }
  if(!r.found){ body.innerHTML='<div class="empty"><div class="big">✅</div><h3>ไม่พบก้อนเนื้อในภาพ CT ชุดนี้</h3>'+
    '<p>'+r.note+' หากต้องการตรวจซ้ำ สามารถอัปโหลดชุดภาพใหม่ได้</p>'+
    '<button class="btn ghost" onclick="go(\'upload.html\')">อัปโหลดชุดภาพใหม่</button></div>'; return; }
  body.innerHTML=
   '<h2 class="t" style="margin:22px 0 12px">ภาพผลการวิเคราะห์</h2><div class="grid3">'+
   '<div><div class="ct" style="background:radial-gradient(circle at 50% 55%,#4b5563,#000 70%)"></div><div class="lbl" style="margin:8px 0 0;text-align:center">CT (2D)</div></div>'+
   '<div><div class="ct"><div style="width:32%;height:32%;border-radius:50%;background:#fff"></div></div><div class="lbl" style="margin:8px 0 0;text-align:center">Mask</div></div>'+
   '<div><div class="ct" style="background:#050810"><div style="width:44%;height:50%;border-radius:48% 52% 45% 55%;background:radial-gradient(circle at 35% 30%,#fca5a5,#dc2626 70%)"></div></div><div class="lbl" style="margin:8px 0 0;text-align:center">3D View</div></div></div>'+
   '<h2 class="t" style="margin:22px 0 10px">ข้อมูลก้อนเนื้อ</h2>'+
   '<div class="twrap"><table><thead><tr><th>ตำแหน่ง</th><th>ขนาด (cm)</th><th>ปริมาตร (cm³)</th><th>Confidence</th></tr></thead>'+
   '<tbody><tr><td>'+r.loc+'</td><td>'+r.size+'</td><td>'+r.vol+'</td><td>'+r.conf+'</td></tr></tbody></table></div>';
}
/* ---------- scans search ---------- */
function filterScans(v){
  v=v.trim().toLowerCase();
  const rows=document.querySelectorAll('#tbody tr');
  let shown=0;
  rows.forEach(r=>{
    const pid=(r.dataset.pid||'').toLowerCase();
    const hit=pid.includes(v);
    r.style.display=hit?'':'none';
    if(hit) shown++;
  });
  const noRes=document.getElementById('noRes');
  if(noRes) noRes.style.display=shown===0?'block':'none';
}
