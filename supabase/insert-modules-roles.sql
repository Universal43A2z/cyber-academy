-- Adds the Cybersecurity Roles modules (weeks 9-13). Regenerate with:
--   node supabase/apply-modules-roles.mjs
-- Idempotent: each week is only inserted if it does not already exist.

create unique index if not exists modules_week_no_key on public.modules (week_no);

insert into public.modules (week_no, title, description, content, published)
select 9, 'Cybersecurity Roles, Specializations & Career Paths', 'A field map of cybersecurity careers: what each role does, the skills it needs, and where the first eight weeks fit.', $C9$# Week 9 — Cybersecurity Roles, Specializations & Career Paths

## One field, many jobs

By now you know that cybersecurity is not a single job. It is a **field of specializations**, each with its own day-to-day work, tools, and career ladder. The good news: the fundamentals you have already studied this term are the **shared foundation** every role stands on.

## The three role families

- **Defensive (Blue Team)** — Detect, contain, and prevent attacks: SOC analyst, incident responder, detection engineer, security operations engineer.
- **Offensive (Red Team)** — Discover weaknesses before attackers do: penetration tester, red teamer, bug bounty researcher, exploit developer.
- **Support (Governance & Platform)** — Keep security working at scale: GRC analyst, security auditor, security architect, DevSecOps engineer, identity and access specialist, CISO.

## A closer look at the common roles

- **SOC Analyst** — Sits at the monitoring console. Reviews alerts, triages suspicious activity, and escalates real incidents. Entry point for most defenders.
- **Incident Responder** — Takes over during a real attack: contains, eradicates, recovers, and writes the after-action report. Connected to your Week 7 work.
- **Penetration Tester** — Legally attacks systems on contract to prove where defenses fail, then writes a fixable report. The offensive entry role.
- **Security Engineer** — Builds and hardens the infrastructure: firewalls, endpoint protection, identity systems, logging pipelines. Strongest technical foundation role.
- **DevSecOps Engineer** — Embeds security tests into software delivery so flaws are caught before release.
- **GRC Analyst** — Governance, risk, and compliance: maps controls to frameworks like NIST and ISO, tracks risks, and prepares for audits.
- **Digital Forensics Examiner** — Preserves and analyzes evidence from disk and memory to reconstruct what happened and support legal action.
- **Security Architect / CISO** — Designs security at the enterprise level and owns the risk strategy. Leadership destination roles.

## Where the first eight weeks fit

- Week 1 (threats, CIA triad) — **every role**, concepts all teams share
- Weeks 2–3 (networking, Linux) — **foundation for every technical role**
- Week 4 (cryptography) — SOC, incident response, compliance, and engineering
- Week 5 (web security) — **penetration testing, DevSecOps, app security**
- Week 6 (firewalls, monitoring) — **SOC analyst, security engineering**
- Week 7 (incident response, forensics) — **IR and forensics careers**
- Week 8 (ethical hacking, CTF) — red team and the security mindset

## How skills are shown to employers

- **Certifications** — The classic ladder is CompTIA Security+ first, then a specialty: CySA+ (defense), PenTest+ or OSCP (offense), CISA or CISM (governance).
- **Hands-on proof** — TryHackMe and HackTheBox profiles, capture-the-flag writeups, and home-lab projects carry more weight with mentors and junior interviews than certificates alone.
- **Practice and communication** — Every technical hire is also a **writing and speaking test**: incident summaries, pentest reports, and explanations given to non-experts.

## This week's task

Pick **two roles** that interest you. For each, write down: the three main tasks, the two tools it relies on, which of your first eight weeks it leans on most, and one cert a rookie in that role would study first. This exercise becomes your career map.$C9$, true
where not exists (select 1 from public.modules where week_no = 9);

insert into public.modules (week_no, title, description, content, published)
select 10, 'Blue Team Ops — Inside a SOC', 'How a Security Operations Center really runs: monitoring, alert triage, playbooks, escalation, and the day-to-day rhythm of a SOC analyst.', $C10$# Week 10 — Blue Team Ops: Inside a SOC

## What a SOC is

A **Security Operations Center** is the war room of a defensive team. It collects logs and alerts from every system — firewalls, endpoints, email gateways, cloud accounts — and watches them continuously to find the attacks that automated prevention missed. The work is organized into tiers so that junior analysts handle volume and senior analysts handle complexity.

## The three tiers of a SOC

- **Tier 1 (Triage and monitoring)** — Watches dashboards, acknowledges alerts, checks simple false positives, and escalates confirmed suspicious events. Entry-level role: learn core hygiene here.
- **Tier 2 (Threat response)** — Investigates escalated cases: pulls packet captures, hunts for related indicators, coordinates containment, and writes the record of what was done.
- **Tier 3 (Threat hunting and analysis)** — Proactively searches for attacks that produced no alert, reverse-engineers malware, and tunes the detection rules so the team sees more signal and less noise.

## The alert lifecycle — triage in practice

- **Acknowledge** — Claim the alert within the agreed time so work is never duplicated.
- **Validate** — Confirm the alert is real, not a false positive. Check the source host, username, time window, and relevance.
- **Triage** — Classify it: severity, impacted systems, business impact, and urgency. Use the playbook for that alert type if one exists.
- **Escalate** — Pass validated incidents to tier 2 with a timeline, evidence, and what you already ruled out.
- **Close the loop** — Record the outcome and the detection improvement so the same alert gets faster next time.

## Indicators of compromise (IOCs)

An alert is triggered by **IOCs** — fingerprints left by an attack:

- **Host-based** — new scheduled tasks, a registry or startup change, an unknown process name or hash
- **Network-based** — a connection to a known-bad IP or domain, unusual protocol usage, a beaconing pattern (regular traffic to one external host)
- **Identity-based** — impossible travel, login from a new device, brute-force traffic, privilege changes

## How a real alert reads

**Example scenario** — At 03:12, the SIEM fires: "Spike in failed logins to the finance VPN account john@acme.com." Tier 1 checks the source IP (a foreign cloud range, new to the org), confirms 40 failed attempts in 12 minutes, then calls it a **credential brute force** and escalates. Tier 2 locks the account, blocks the source, requests MFA re-verification, and searches for earlier logins from that IP across the last 30 days — a classic **account-takeover hunting** move.

## The tools a SOC relies on

- **SIEM** — Splunk, Elastic, Microsoft Sentinel, Wazuh: central log ingestion and alert correlation
- **EDR** — CrowdStrike, Defenders: endpoint visibility beyond the antivirus
- **SOAR** — automation of repetitive playbook steps (block IP, quarantine file)
- **Threat intel feeds** — curated lists of known attacker infrastructure used to enrich alerts
- **Packet analysis** — Wireshark and tcpdump for evidence-level network review

## Making the call without a playbook

When there is no playbook yet, reason from the **kill chain** (from your Week 6 work): what stage is this activity at — recon, delivery, exploitation, post-compromise? Answering that one question tells you what to protect next and how urgent the team should be.

## This week's task

Create a **mini triage table** for a made-up org: three alert types (a weird PowerShell command, a login from a new country, a spike in outbound traffic at 2 a.m.). For each, fill in: IOCs to look for, severity guess, and the first three steps you would take. This is the exact artefact a Tier 1 interview asks you to describe.$C10$, true
where not exists (select 1 from public.modules where week_no = 10);

insert into public.modules (week_no, title, description, content, published)
select 11, 'Red Team, Pentesting & Responsible Offense', 'The offensive side of the field: pentest methodology, rules of engagement, reporting, and the laws that keep hacking legal.', $C11$# Week 11 — Red Team, Pentesting & Responsible Offense

## Offense only with permission

Everything in offensive security sits on one rule: **you only attack what you are authorized to attack, to the depth you are authorized to go**. Professional pentests start with a signed **rules of engagement** document that states scope, timeline, allowed techniques, and what to do on discovery of severe issues. Without that document, the same commands are a crime.

## The pentest lifecycle

- **Planning and scoping** — Agree on targets, exemptions, hours, contact channels, and emergency-stop procedures.
- **Reconnaissance** — Gather information: which hosts, ports, services, and versions are exposed. Open-source research plus active scanning (nmap and service fingerprinting from your Week 2 skills).
- **Vulnerability analysis** — Compare the service versions and configurations you found against known weaknesses; study the applications as a developer would.
- **Exploitation** — Demonstrate the impact with the minimum necessary access: break in, verify the blast radius, then stop. The goal is proof, not damage.
- **Post-exploitation** — Document what was reached, what credentials were recovered, and what the crown jewels turned out to be.
- **Reporting** — Deliver a prioritized report: findings ordered by risk, reproduction steps, and concrete fixes. A pentest report is judged on how plainly it tells the client what to repair.

## Common offensive tooling

- **nmap** — host discovery and port/service mapping (you already know this one)
- **Metasploit Framework** — exploit development and modular exploitation playbooks
- **Burp Suite** — web application testing: intercept, modify, replay requests
- **ffuf and gobuster** — finding hidden endpoints and directories
- **hashcat and john** — password hash analysis (only your own or lab data)
- **C2 frameworks** — command-and-control simulators used by advanced red teams during authorized exercises

## Red team vs pentest vs bug bounty

- **Pentest** — A fixed-time engagement with a defined scope and a single report.
- **Red team exercise** — A full simulation of an adversary: evasion, persistence, and stealing a defined objective, often with the offense's identity "unknown" to the defense.
- **Bug bounty** — Continuous, bounded testing of public programs under vendor rules; you are paid per verified finding.

## Responsible disclosure

If you find a weakness in a system you do not run, **do not exploit further**. Report it privately to the owner with clear reproduction steps, give them reasonable time to fix it, and only publish after agreement. This is the difference between a researcher and an attacker — the industry treats the pair differently.

## Why offensive skills make you a better defender

The best defenders have run an attack once. Exploiting a web app teaches you exactly which log lines a developer should be watching; running a phishing simulation teaches you what your awareness training must cover. Offense and defense are two views of the same map — and employers increasingly want people who can work both sides.

## This week's task

Map a **mini pentest plan** for a fictional target: pick a lab or any authorized environment, then write the scope sentence, list three tools you would use for recon, one likely weakness you would look for, and how you would word the finding in your report. Getting the framing right is half the skill.$C11$, true
where not exists (select 1 from public.modules where week_no = 11);

insert into public.modules (week_no, title, description, content, published)
select 12, 'Purple Team, DevSecOps & Security Engineering', 'Where the two sides meet: embedding security into software delivery, threat modeling, and the engineering roles scaling security.', $C12$# Week 12 — Purple Team, DevSecOps & Security Engineering

## When red and blue work together

A **purple team** is not a new job title — it is a practice where red team and blue team run an exercise with shared goals. Instead of red trying to beat blue, the team debriefs every phase: what was seen, what was missed, what should the detection team build. This turns every engagement into training for the whole organization.

## Threat modeling — designing before defending

Before writing code or controls, engineers ask four questions:

- **What are we building?** — the system and its data flows
- **What can go wrong?** — STRIDE: Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege
- **What are we going to do about it?** — the controls to add
- **Did we do a good job?** — testing and review

Threat modeling catches flaws while they are cheap to fix, which is why it is one of the most valued engineering habits.

## DevSecOps — security inside the pipeline

The old model was: developers build, security tests once before release. DevSecOps pushes security checks into the **delivery pipeline** so every commit is tested:

- **SAST** — static analysis scans source code on every build for injection, weak crypto, and secrets left in code
- **DAST** — dynamic testing exercises the running application like an attacker
- **Dependency scanning** — alerts when a shipped library has a known vulnerability
- **Secret scanning** — catches API keys and passwords before they reach the repository
- **IaC scanning** — reviews infrastructure-as-code templates for open ports and exposed storage before deploy

When a scan fails, the build fails, and the developer fixes the issue in the same sprint — that is the shift-left principle, and it is the day job of a DevSecOps engineer.

## Security engineering beyond the pipeline

- **Endpoint hardening** — enforcing baselines, patch cycles, and zero trust on every device
- **Identity and access (IAM)** — least privilege, MFA everywhere, and lifecycle for accounts
- **Cloud security** — misconfiguration reviews of S3 buckets, security groups, and permissions
- **Detection engineering** — writing the SIEM and EDR rules that tell the SOC what to look for

## Zero trust in one line

**Never trust a host just because it is "inside".** Every request, from anywhere, must prove identity and be authorized. Zero trust architecture exists because perimeter-only security assumes the insider is always safe — which the last ten years of breaches have disproven.

## Careers on this side of the field

- **DevSecOps engineer** — owns the pipeline security gates
- **Security engineer** — owns the platform defenses
- **Cloud security engineer** — owns the cloud environment posture
- **Detection engineer** — owns the rules and detections
- **Application security (AppSec) engineer** — owns code-level security and developer training

## This week's task

Pick one small system you use at school or at home (an app, a lab, a website). Run it through the four threat modeling questions above and list two controls you would add. You have just done the exact exercise a security engineer brings to every design review.$C12$, true
where not exists (select 1 from public.modules where week_no = 12);

insert into public.modules (week_no, title, description, content, published)
select 13, 'GRC, Audits & Cyber Leadership', 'Governance, risk and compliance — the roles that keep security organized: frameworks, risk registers, audits, and the path to leadership.', $C13$# Week 13 — GRC, Audits & Cyber Leadership

## Security needs an operating system too

Technical controls fail when nobody says what the rules are, how risks get decided, or who is accountable. **GRC** — Governance, Risk, and Compliance — is the discipline that answers those questions, and it is where a large share of real security jobs live.

## Governance

Governance is **who decides what**: the policies, committees, and accountability that make security deliberate instead of accidental.

- Policies (what we must do) cascade into standards (how) and procedures (step by step).
- The board and senior leadership own the final risk decisions.
- Every system has an owner — someone accountable if it is mishandled.

## Risk management in three steps

- **Identify** — list the assets and the threats that matter to them
- **Analyze** — estimate likelihood and impact; score is often low/medium/high or 1–5
- **Treat** — accept, avoid, transfer (insurance), or mitigate with controls — and record it in a **risk register**

A risk register is a living table: asset, threat, score, owner, chosen treatment, review date. Audit teams love a current risk register because it proves decisions were made on purpose.

## Frameworks — the shared language

- **NIST Cybersecurity Framework** — organize: Identify, Protect, Detect, Respond, Recover
- **ISO/IEC 27001** — a certifiable management system covering policy, risk, access control, and operations
- **CIS Controls** — a prioritized list of 18 actions that stop most standard attacks
- **SOC 2** — the report most clients demand from a cloud service provider

Frameworks do not replace judgment; they give your judgment a structure that auditors and clients can verify.

## Compliance — the "must" layer

Compliance is meeting **required** rules: laws, contracts, and standards. You have already met several. Breach-notification obligations, payment card rules (PCI DSS), and privacy rules (like the DPA) all translate into concrete technical controls — encryption, logging, access reviews. A GRC analyst's job is to prove, with evidence, that the controls exist and work.

## The audit

An audit answers one question: **does what you claim match what you do?** Auditors sample evidence — policy documents, access review records, firewall config reviews, training completion reports — and test whether controls operate as described. Passing an audit is what lets a company keep its certifications and its clients.

## Roles and the leadership ladder

- **GRC analyst** — maintains the risk register, policies, and audit evidence. The classic entry to this family.
- **Compliance analyst** — tracks legal and regulatory obligations into control requirements.
- **Security auditor** — reviews controls against frameworks and writes findings.
- **Security manager** — runs the program and its people.
- **CISO (Chief Information Security Officer)** — owns the entire program, reports to the board, and translates risk into business language.

Leadership in security is a **communication and judgment** job layered on technical credibility. The strongest CISOs are the ones who can explain a risk to a non-technical board and still challenge a senior engineer on the technical detail.

## This week's task — capstone

Build a one-page **mini risk register** for your own home setup: three assets, their threats, likelihood and impact scores, and the treatment you choose for each. Then write one paragraph arguing which of your three assets the organization style would protect first, and why. That short document is a sample of exactly the work a GRC analyst produces daily.$C13$, true
where not exists (select 1 from public.modules where week_no = 13);
