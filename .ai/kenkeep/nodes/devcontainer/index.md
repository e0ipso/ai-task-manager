# kenkeep Index: devcontainer

↑ Parent: [kenkeep](../index.md)

> kenkeep navigation: the injected body above is the root index node, the top-level catalog of branches and root-level leaves. Do not expect the whole knowledge base here; descend on demand. Read the root index node, pick one or more branches whose intent and tags match your task (several branches can be relevant), and read those branch `index.md` nodes. Descend further only where the task needs it, opening only the leaves you have confirmed are relevant. Follow each leaf's `relates_to` and `depends_on` cross edges to reach related leaves in other branches. You decide how deep to go per branch.

> This index only orients you; leaves hold the durable guidance. Open at least one relevant leaf before acting.

## Subfolders
_None._

## Conventions (how we build)
- Open [**Keep t3 pairing auth — sibling devcontainers can reach the Docker bridge**](practice-keep-t3-pairing-auth-sibling-devcontainers-can-reach-the-docker-bridge.md) to learn about: t3 binds 0.0.0.0 inside the container; sibling devcontainers on the Docker default bridge can reach it without auth. #devcontainer #docker #security #t3
- Open [**Keep --host 0.0.0.0 in t3 serve — Docker port forwarding needs it**](practice-keep-host-0-0-0-0-in-t3-serve-docker-port-forwarding-needs-it.md) to learn about: t3 serve inside the devcontainer must bind 0.0.0.0; Docker port publish forwards to eth0, not container loopback. #devcontainer #docker #t3 #networking

## Components (what exists)
- Open [**t3-serve.sh + new-devcontainer — stable devcontainer-to-t3-desktop workflow**](map-t3-serve-sh-new-devcontainer-stable-devcontainer-to-t3-desktop-workflow.md) to learn about: Two tools connect t3 desktop to a devcontainer: new-devcontainer bakes a deterministic port; t3-serve.sh is exec-only. #devcontainer #t3 #docker #workflow

## By topic

### #devcontainer
- Open [**Keep t3 pairing auth — sibling devcontainers can reach the Docker bridge**](practice-keep-t3-pairing-auth-sibling-devcontainers-can-reach-the-docker-bridge.md) — t3 binds 0.0.0.0 inside the container; sibling devcontainers on the Docker default bridge can reach it without auth.
- Open [**Keep --host 0.0.0.0 in t3 serve — Docker port forwarding needs it**](practice-keep-host-0-0-0-0-in-t3-serve-docker-port-forwarding-needs-it.md) — t3 serve inside the devcontainer must bind 0.0.0.0; Docker port publish forwards to eth0, not container loopback.
- Open [**t3-serve.sh + new-devcontainer — stable devcontainer-to-t3-desktop workflow**](map-t3-serve-sh-new-devcontainer-stable-devcontainer-to-t3-desktop-workflow.md) — Two tools connect t3 desktop to a devcontainer: new-devcontainer bakes a deterministic port; t3-serve.sh is exec-only.
### #docker
- Open [**Keep t3 pairing auth — sibling devcontainers can reach the Docker bridge**](practice-keep-t3-pairing-auth-sibling-devcontainers-can-reach-the-docker-bridge.md) — t3 binds 0.0.0.0 inside the container; sibling devcontainers on the Docker default bridge can reach it without auth.
- Open [**Keep --host 0.0.0.0 in t3 serve — Docker port forwarding needs it**](practice-keep-host-0-0-0-0-in-t3-serve-docker-port-forwarding-needs-it.md) — t3 serve inside the devcontainer must bind 0.0.0.0; Docker port publish forwards to eth0, not container loopback.
- Open [**t3-serve.sh + new-devcontainer — stable devcontainer-to-t3-desktop workflow**](map-t3-serve-sh-new-devcontainer-stable-devcontainer-to-t3-desktop-workflow.md) — Two tools connect t3 desktop to a devcontainer: new-devcontainer bakes a deterministic port; t3-serve.sh is exec-only.
### #t3
- Open [**Keep t3 pairing auth — sibling devcontainers can reach the Docker bridge**](practice-keep-t3-pairing-auth-sibling-devcontainers-can-reach-the-docker-bridge.md) — t3 binds 0.0.0.0 inside the container; sibling devcontainers on the Docker default bridge can reach it without auth.
- Open [**Keep --host 0.0.0.0 in t3 serve — Docker port forwarding needs it**](practice-keep-host-0-0-0-0-in-t3-serve-docker-port-forwarding-needs-it.md) — t3 serve inside the devcontainer must bind 0.0.0.0; Docker port publish forwards to eth0, not container loopback.
- Open [**t3-serve.sh + new-devcontainer — stable devcontainer-to-t3-desktop workflow**](map-t3-serve-sh-new-devcontainer-stable-devcontainer-to-t3-desktop-workflow.md) — Two tools connect t3 desktop to a devcontainer: new-devcontainer bakes a deterministic port; t3-serve.sh is exec-only.
### #networking
- Open [**Keep --host 0.0.0.0 in t3 serve — Docker port forwarding needs it**](practice-keep-host-0-0-0-0-in-t3-serve-docker-port-forwarding-needs-it.md) — t3 serve inside the devcontainer must bind 0.0.0.0; Docker port publish forwards to eth0, not container loopback.
### #security
- Open [**Strikethroo profile packages tolerate inert package-root extras**](../practice-strikethroo-profile-packages-tolerate-inert-package-root-extras.md) — validateProfilePackage scopes to profile.yaml plus config/; entries at the package root are accepted and are never copied, hash-tracked, or executed.
- Open [**How init --profile resolves, validates, and stages a strikethroo profile**](../cli/map-init-profile-resolves-validates-and-stages-a-strikethroo-profile.md) — src/profiles.ts: fixed source resolution order, all-or-nothing link-refusing validation, overlay staging fed to copyCommonTemplates.
- Open [**export profile copies workspace config verbatim without redaction**](../cli/map-export-profile-copies-workspace-config-verbatim-without-redaction.md) — exportProfile copies config/ minus schemas/, validates its own output, and warns that config.yaml and cli_args ship as-is.
### #workflow
- Open [**Author social and carousel assets with Dalia brand rules**](../web/branding/practice-use-dalia-brand-rules-for-social-carousel-assets.md) — Social assets use Dalia tokens, Fraunces/Outfit, Lucide icons, and HTML + Playwright screenshots — not Mermaid or the Dalia Wordmark component.
- Open [**t3-serve.sh + new-devcontainer — stable devcontainer-to-t3-desktop workflow**](map-t3-serve-sh-new-devcontainer-stable-devcontainer-to-t3-desktop-workflow.md) — Two tools connect t3 desktop to a devcontainer: new-devcontainer bakes a deterministic port; t3-serve.sh is exec-only.