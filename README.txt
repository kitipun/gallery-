THE ARCHIVE — CLOUD READY

อัปโหลดไฟล์เหล่านี้ทับไฟล์เดิมที่ root ของ GitHub repository:
- index.html
- style.css
- script.js

ระบบ Cloud ที่เปิดใช้งาน:
- Supabase Storage bucket: gallery-images
- Supabase table: photos
- เพิ่มรูปจากหน้าเว็บแล้วทุกเครื่องเห็นตรงกัน
- Show / Hide sync
- Featured sync
- เปลี่ยน Zone sync
- Finale On/Off sync
- Edit title/date sync
- Delete ลบทั้งข้อมูลและไฟล์บน Storage
- รูปถูกย่อฝั่ง browser ก่อน upload สูงสุด 2200px และแปลงเป็น WebP เพื่อประหยัดพื้นที่/โหลดเร็วขึ้น

Security ตามที่ตั้งค่าในโปรเจกต์ปัจจุบัน:
- ใครมีลิงก์สามารถอ่านและแก้ Gallery ได้
- อย่าใส่ service_role / secret key / database password ใน GitHub

Publishable key ที่อยู่ใน script.js เป็น key สำหรับ client-side ตามการออกแบบของ Supabase
