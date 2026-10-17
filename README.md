<div align="center">

<img src="docs/banner.svg" alt="IT Expiry Alert" width="100%">

<br>

<img src="https://img.shields.io/badge/Node.js-20%2B-3c873a?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js">
<img src="https://img.shields.io/badge/Vercel-Serverless-000?style=flat-square&logo=vercel&logoColor=white" alt="Vercel">
<img src="https://img.shields.io/badge/Upstash-Redis-00e9a3?style=flat-square&logo=upstash&logoColor=white" alt="Upstash">
<img src="https://img.shields.io/badge/Vercel-Cron-000?style=flat-square&logo=vercel&logoColor=white" alt="Vercel">

</div>

## Overview

ระบบแจ้งเตือนล่วงหน้าก่อนทรัพย์สินด้านไอทีหมดอายุ ครอบคลุมใบรับรอง SSL ชื่อโดเมน ลิขสิทธิ์ซอฟต์แวร์ และสัญญาบำรุงรักษา (MA) ซึ่งหากหมดอายุโดยไม่ทราบล่วงหน้าอาจทำให้ระบบหยุดให้บริการ ทดแทนการติดตามด้วยตาราง Excel

*Proactive expiry monitoring for SSL certificates, domains, software licenses and maintenance contracts, with scheduled multi-channel alerts.*

<table>
<tr>
<td width="72%"><img src="docs/screenshot.png" alt="IT Expiry Alert — desktop"></td>
<td width="28%"><img src="docs/screenshot-phone.png" alt="IT Expiry Alert — mobile"></td>
</tr>
<tr><td align="center"><sub>หน้าจอคอมพิวเตอร์ (ข้อมูลตัวอย่าง)</sub></td><td align="center"><sub>หน้าจอโทรศัพท์มือถือ</sub></td></tr>
</table>

## Key Features

- **ตรวจสอบใบรับรอง SSL อัตโนมัติ** — เชื่อมต่อเว็บไซต์จริงและอ่านวันหมดอายุจากใบรับรอง
- **ตรวจสอบโดเมนอัตโนมัติ** ผ่าน RDAP (โดเมน .th ไม่มีข้อมูล RDAP จึงกำหนดวันที่เอง)
- **ลิขสิทธิ์ซอฟต์แวร์ / สัญญา MA / รายการอื่น** — กำหนดวันหมดอายุเอง
- **แจ้งเตือนทุกวันเวลา 08:00 น.** (Vercel Cron) ผ่าน Discord, Slack, Google Chat, LINE หรือ Telegram
- **แจ้งเตือนเป็นระยะ** ที่ 60 / 30 / 14 / 7 / 3 / 1 / 0 วัน ระยะละหนึ่งครั้ง และเริ่มนับใหม่อัตโนมัติเมื่อมีการต่ออายุ
- **แจ้งเหตุขัดข้อง** เมื่อการตรวจสอบอัตโนมัติไม่สำเร็จ

## Tech Stack

- Node.js (ES Modules) · Vercel Serverless Functions · Vercel Cron
- Upstash Redis (ฐานข้อมูล) · TLS / RDAP lookups · HTML / CSS / JavaScript

## Getting Started

```bash
npm install
cp .env.example .env
npm run dev            # http://localhost:3000
```

หากยังไม่ได้กำหนดฐานข้อมูล ระบบจะจัดเก็บข้อมูลเป็นไฟล์ภายในโฟลเดอร์ `.data/` สำหรับการทดสอบในเครื่อง

## Configuration

| Variable | Description |
|---|---|
| `ADMIN_KEY` | รหัสผู้ดูแลระบบ ใช้เข้าถึงทุกหน้า (จำเป็น) |
| `CRON_SECRET` | ใช้ยืนยันคำขอจาก Vercel Cron (สร้างโดย Vercel) |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | การเชื่อมต่อ Upstash Redis |
| `NOTIFY_WEBHOOK_URL` | Webhook ของ Discord / Slack / Google Chat |
| `LINE_CHANNEL_ACCESS_TOKEN`, `LINE_TO` | LINE Messaging API |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | Telegram Bot |

## Deployment (Vercel)

1. นำเข้าโปรเจกต์จาก GitHub ใน Vercel
2. เพิ่มฐานข้อมูล **Upstash Redis** ในเมนู Storage
3. กำหนดค่า `ADMIN_KEY` และช่องทางแจ้งเตือนอย่างน้อยหนึ่งช่องทาง
4. Deploy — กำหนดการ Cron อยู่ใน `vercel.json` แล้ว (`0 1 * * *` UTC = 08:00 น. เวลาประเทศไทย)

## Related Projects

[IT Runbook](https://github.com/tanakrthum254614-max/it-runbook) · [IT Asset Tracker](https://github.com/tanakrthum254614-max/it-asset-tracker) — ชุดเครื่องมือสำหรับงานสนับสนุนไอทีภายในองค์กร

---

<div align="center"><sub>Developed by <a href="https://github.com/tanakrthum254614-max">Tan Akrthum</a> · Bangkok, Thailand</sub></div>
