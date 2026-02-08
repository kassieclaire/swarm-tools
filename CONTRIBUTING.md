# Contributing to swarm-tools

## Vouch Requirement

This repo uses [mitchellh/vouch](https://github.com/mitchellh/vouch) to gate pull requests behind explicit contributor trust. PRs from unvouched contributors are **automatically closed** with an explanation.

This is supply chain security for an npm-published package. Nothing personal.

## How to get vouched

1. Open an issue on this repo introducing yourself
2. A maintainer will comment `vouch @your-username` on the issue
3. Your GitHub handle gets added to `.github/VOUCHED.td`
4. Open your PR (or reopen the closed one and comment `/recheck`)

## Re-running the vouch check

If you were vouched after your PR was auto-closed, comment `/recheck` on the PR to trigger a re-check.

## For maintainers

On any issue or PR, comment:
- `vouch @username` - add someone to the trust list
- `unvouch @username` - remove someone
- `denounce @username` - also removes someone
