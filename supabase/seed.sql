-- =====================================================================
-- F1 STACKMIND Cyber Academy — seed data
-- Run AFTER schema.sql. Idempotent: safe to re-run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Weekly curriculum modules (8 weeks)
-- ---------------------------------------------------------------------

insert into public.modules (week_no, title, description, content, video_url, published) values
(1,
 'Introduction to Cybersecurity & Career Paths',
 'What cybersecurity is, who defends it, and the careers you can build.',
 '# Week 1 — Introduction to Cybersecurity

## What is cybersecurity?

Cybersecurity is the practice of protecting systems, networks, programs, and data from digital attacks. It is not one skill — it is a **discipline** that blends technology, process, and people.

## Why it matters

- Attacks cost organizations millions
- One weak password can breach an entire network
- Defenders are in high global demand

## Career tracks you can train for

1. Security Operations Center (SOC) Analyst — monitors alerts
2. Penetration Tester — legally breaks in to find flaws
3. Security Engineer — builds and configures defenses
4. Incident Responder — reacts when systems are compromised
5. Threat Analyst — studies how attackers behave

## The CIA Triad

**Confidentiality** — only authorized people see data.
**Integrity** — data is accurate and unmodified.
**Availability** — systems are up when needed.

> Every security control you study maps back to one of these three goals.

## Starter activity

- In your notes, write one example failure for each of C, I, and A.
- Search the web for a recent news headline about a breach. Which part of the triad was broken?',
null, true),

(2,
 'Networking Fundamentals for Defenders',
 'IPs, ports, protocols, and how data travels.',
 '# Week 2 — Networking Fundamentals

## How machines talk

Devices on a network are identified by an **IP address**. Services on a device are reached through **ports** (like doors on a building).

## Key protocols

1. **HTTP/HTTPS** — web traffic (port 80 / 443)
2. **DNS** — translates names like google.com into IPs (port 53)
3. **SSH** — secure remote shell (port 22)
4. **SMTP** — sending email (port 25)

## The OSI model (simplified)

**Application → Transport → Network → Data Link → Physical**  
The **Transport** layer splits data into segments; the **Network** layer routes them with IP.

> A defender must be fluent in packets. `tcpdump` and `Wireshark` are your friends.

## Lab exercise

- Use `ping` and `traceroute` to map a route to your school gateway.
- Use `nmap -sV` (only on systems you own) to discover running services.',
null, true),

(3,
 'Linux & Operating System Essentials',
 'The command line, users, permissions, and processes.',
 '# Week 3 — Linux Essentials

## Why Linux matters

Most servers run Linux. Most hacking tools run Linux. Learn it and you unlock the whole field.

## Directory structure

- `/etc` — configuration files
- `/var/log` — logs (investigate here)
- `/home` — user home directories
- `/tmp` — temporary files

## Permissions

Each file has read, write, and execute bits for owner, group, and others:
`rwx rwx rwx` is read as **user:group:other**.

`chmod 755 script.sh` — owner can do everything, everyone else reads/executes.

## Essential commands

1. `ls`, `cd`, `cat`, `grep`, `find` — explore
2. `ps`, `top`, `kill` — manage processes
3. `sudo` — run as administrator
4. `man` — read manuals forever

## Activity

- Create a user, a file owned by that user, and change its permissions.
- Read `/var/log/syslog` (or `auth.log`) and find the last failed login.',
null, true),

(4,
 'Cryptography Basics',
 'Hashing, encryption, and why passwords are hashed.',
 '# Week 4 — Cryptography Basics

## Two families

**Symmetric encryption** — one key encrypts and decrypts (AES).
**Asymmetric encryption** — a key pair: public encrypts, private decrypts. Used by TLS/HTTPS.

## Hashing vs encryption

- Hashing is one-way (SHA-256). You cannot \"decrypt\" a hash.
- Passwords are stored as **hashes**, not plaintext.
- **Salting** adds random data so identical passwords hash differently.

## In the defensive toolkit

- Full-disk encryption protects laptops
- TLS protects data in transit
- Hashes verify file integrity (download a file, compare checksums)

## Try it

- In a terminal: `echo -n "cyber" | sha256sum`
- `echo -n "cyber" | md5sum` — compare: hashing the same input always produces the same output.',
null, true),

(5,
 'Web Security Essentials',
 'How websites are attacked and defended (OWASP).',
 '# Week 5 — Web Security

## The OWASP Top 10

The most common web weaknesses, updated regularly. Three you will meet constantly:

1. **Injection (SQLi)** — attacker input becomes database commands
2. **Broken authentication** — weak logins, session hijacking
3. **Cross-Site Scripting (XSS)** — attacker scripts run in another user''s browser

## Real examples

- `Login'' OR 1=1 --` (SQL injection) — always use **parameterized queries**
- `<script>alert(1)</script>` in a comment box (XSS) — never trust user input
- Reused passwords across sites — use a password manager

## Defensive checklist

- Validate and sanitize all input, everywhere
- Hash passwords, don''t encrypt them
- Use `Content-Security-Policy` headers
- Keep dependencies patched

## Activity

- Open a site you use and inspect its HTTP headers (DevTools → Network).
- Write down three controls this site implements.',
null, true),

(6,
 'Network Security, Firewalls & Monitoring',
 'Segmentation, filtering, and watching the wire.',
 '# Week 6 — Network Security

## Segmentation

Brick walls between parts of the network: the office, the server room, and the DMZ should not be one big flat network. If one zone is breached, the rest survive.

## Firewalls

Firewalls filter traffic by **rules**:

1. Default deny — block everything not explicitly allowed
2. Allow only needed ports and sources
3. Log hits on denied rules — they are attacker fingerprints

## Monitoring

**IDS** watches and warns. **IPS** watches and blocks. Logs from `auth.log`, firewalls, and web servers form your evidence base.

## Mini-lab

- Explain why an open port like 3389 (RDP) should never face the internet.
- Sketch a network with a web server in a DMZ and data inside a segmented LAN.',
null, true),

(7,
 'Incident Response & Digital Forensics',
 'The 6-step response lifecycle and clean evidence handling.',
 '# Week 7 — Incident Response

## The response lifecycle

1. **Preparation** — playbooks and backups before anything happens
2. **Detection** — alerting on unusual activity
3. **Containment** — cut off the attacker without destroying evidence
4. **Eradication** — remove malware and close the hole
5. **Recovery** — restore and verify
6. **Lessons learned** — write the report

## Forensics golden rules

- **Protect evidence** — image the disk, don''t work on the original
- **Document everything** — timestamps, hashes, screenshots
- **Chain of custody** — who touched the evidence and when

## Common artifacts

- Event logs (`auth.log`, `security.evtx`)
- Prefetch / browser history
- Deleted-file recovery (file carving)
- Memory images

## Tabletop drill

Walk through a scenario: a staff laptop is infected through a phishing email. Which steps of the lifecycle happen in which order?',
null, true),

(8,
 'Ethical Hacking, CTF & Your Roadmap',
 'The legal frame, CTF platforms, and how to keep learning.',
 '# Week 8 — Ethical Hacking & Your Roadmap

## Legal and ethical frame

**Always get written authorization** before testing anything that is not yours. The line between pen tester and criminal is permission.

## Capture The Flag (CTF)

CTF competitions are the best playgrounds:

- **Jeopardy-style** — categories: web, crypto, forensics, binary, OSINT
- **Attack-Defense** — teams protect servers while attacking others

> Flags look like `FLAG{something_secret}`. A flag is proof of a finding.

## Recommended practice

1. TryHackMe / Hack The Box — guided labs
2. OWASP Juice Shop — legal vulnerable web app
3. OverTheWire Bandit — Linux command-line puzzles

## Your roadmap

- Master Linux, then networking, then web
- Do labs weekly — small and consistent beats cramming
- Keep a security notebook (your notes become your portfolio)
- Follow one cert path when ready (CompTIA Security+ is a common first step)

## Graduation task

Write a two-paragraph career plan: which role in cybersecurity you want, the first three skills you will learn, and your 90-day goal.',
null, true);

-- ---------------------------------------------------------------------
-- Quizzes (server-scored; the options JSONB pair with correct_index)
-- ---------------------------------------------------------------------

insert into public.quizzes (week_no, title, description, time_limit_sec, published) values
(2, 'Basics Bootcamp', 'Covers weeks 1—2: terminology, CIA triad, networking basics.', 600, true),
(4, 'System Hardening', 'Covers weeks 3—4: Linux, permissions, hashing and encryption.', 600, true),
(6, 'Web & Network Defense', 'Covers weeks 5—6: OWASP, firewalls, segmentation.', 600, true),
(8, 'IR & Hacking Capstone', 'Covers weeks 7—8: incident response, forensics, ethics.', 600, true);

-- Week 2 quiz
insert into public.quiz_questions (quiz_id, question, options, correct_index, points, position)
select q.id, o.question, o.options, o.correct_index, o.points, o.position
from public.quizzes q,
jsonb_to_recordset('[
  {"question":"Which of the following BEST describes the goal of *Confidentiality* in the CIA triad?","options":["Systems are always available","Only authorized people can view data","Data cannot be changed","Every login is audited"],"correct_index":1,"points":1,"position":0},
  {"question":"Which protocol is used to translate domain names into IP addresses?","options":["SMTP","HTTP","DNS","SSH"],"correct_index":2,"points":1,"position":1},
  {"question":"SSH typically operates on which default port?","options":["21","22","80","443"],"correct_index":1,"points":1,"position":2},
  {"question":"A penetration tester, unlike a criminal, must always have what?","options":["A VPN","Written authorization","Admin credentials","A burner laptop"],"correct_index":1,"points":1,"position":3},
  {"question":"Which layer of the OSI model is responsible for end-to-end delivery of segments?","options":["Application","Transport","Network","Physical"],"correct_index":1,"points":1,"position":4}
]'::jsonb) as o(question text, options jsonb, correct_index int, points int, position int)
where q.title = 'Basics Bootcamp';

-- Week 4 quiz
insert into public.quiz_questions (quiz_id, question, options, correct_index, points, position)
select q.id, o.question, o.options, o.correct_index, o.points, o.position
from public.quizzes q,
jsonb_to_recordset('[
  {"question":"Which directory typically holds configuration files on Linux?","options":["/tmp","/home","/etc","/dev"],"correct_index":2,"points":1,"position":0},
  {"question":"Password storage should use which technique?","options":["Encryption then store the key","Hashing plus a random salt","Plaintext for speed","Base64 encoding"],"correct_index":1,"points":1,"position":1},
  {"question":"Hashing is best described as…","options":["Reversible encoding","One-way transformation","Compression","Obfuscation only"],"correct_index":1,"points":1,"position":2},
  {"question":"chmod 755 gives the owner which rights?","options":["Read only","Read and write","Read, write, execute","Execute only"],"correct_index":2,"points":1,"position":3},
  {"question":"Which encryption family uses both a public and a private key?","options":["Symmetric","Asymmetric","Hashing","Encoding"],"correct_index":1,"points":1,"position":4}
]'::jsonb) as o(question text, options jsonb, correct_index int, points int, position int)
where q.title = 'System Hardening';

-- Week 6 quiz
insert into public.quiz_questions (quiz_id, question, options, correct_index, points, position)
select q.id, o.question, o.options, o.correct_index, o.points, o.position
from public.quizzes q,
jsonb_to_recordset('[
  {"question":"`Login'' OR 1=1 --` is an example of which attack?","options":["XSS","SQL injection","Phishing","Brute force"],"correct_index":1,"points":1,"position":0},
  {"question":"What does XSS stand for?","options":["Extra Site Security","Cross-Site Scripting","Extreme Session Scan","XML Site Syntax"],"correct_index":1,"points":1,"position":1},
  {"question":"The BEST firewall posture is…","options":["Allow all, block known bad","Default deny, allow explicitly","Deny after 5 failures","Log only"],"correct_index":1,"points":1,"position":2},
  {"question":"Which browser mechanism restricts what scripts a page can load?","options":["Zone ID","Content-Security-Policy","SameSite","MFA"],"correct_index":1,"points":1,"position":3},
  {"question":"A web server placed in a DMZ is mainly to…","options":["Speed up the page","Isolate it from internal data","Save bandwidth","Hide the IP"],"correct_index":1,"points":1,"position":4}
]'::jsonb) as o(question text, options jsonb, correct_index int, points int, position int)
where q.title = 'Web & Network Defense';

-- Week 8 quiz
insert into public.quiz_questions (quiz_id, question, options, correct_index, points, position)
select q.id, o.question, o.options, o.correct_index, o.points, o.position
from public.quizzes q,
jsonb_to_recordset('[
  {"question":"Which phase of incident response happens FIRST after an alert fires?","options":["Eradication","Containment","Recovery","Preparation"],"correct_index":1,"points":1,"position":0},
  {"question":"Working directly on an original compromised disk is bad forensics because…","options":["It is slow","Evidence can be altered","No internet access","It voids the warranty"],"correct_index":1,"points":1,"position":1},
  {"question":"A flag in a CTF is…","options":["A server restart","Proof of a finding","A firewall rule","A packet"],"correct_index":1,"points":1,"position":2},
  {"question":"Which is a legal platform for practicing web attacks?","options":["A neighbor''s site","OWASP Juice Shop","The school grade portal","Any login page"],"correct_index":1,"points":1,"position":3},
  {"question":"In ______, teams attack each other while defending their own servers.","options":["Jeopardy style","Attack-Defense","Capture-Only","SOC drilling"],"correct_index":1,"points":1,"position":4}
]'::jsonb) as o(question text, options jsonb, correct_index int, points int, position int)
where q.title = 'IR & Hacking Capstone';