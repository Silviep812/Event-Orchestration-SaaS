# Starter Plan Launch Notes (Task 1)

**Date:** July 30, 2026  
**Scope:** Free Starter Plan public launch path — **no Stripe** in Task 1.

## What “Launch Starter Plan” means in Task 1

1. Marketing site CTAs use **Try free Starter Plan** language.
2. Sign-up is available at `/auth?tab=signup`.
3. New users complete onboarding, then enter via **Communication/Team** (no events) or Manage Event (returning).
4. Starter users can:
   - From Communication/Team, use **Browse Themes / Create Event** to start
   - Create events
   - Use Planning Assets (including two seeded workflow templates)
   - Track budget in Project Management → Budget
5. Paid upgrades (Pro / Business / Enterprise / One-time checkout) remain **Task 2**.

## Marketing limits (documented, not fully gated)

Landing copy mentions limited templates/themes for Starter. Full commercial enforcement is deferred to Stripe/feature-gating (Task 2). Soft behavior today: free signup + full core planning tools for acceptance.

## Smoke path

1. Open `/` → Try free Starter Plan  
2. Sign up → confirm email if required  
3. Complete onboarding → land on Communication / Team  
4. Browse Themes / Create Event → Create Event  
5. Open Planning Assets → apply a starter template  
6. Open Project Management → Budget → add a hospitality line  
7. Open Communication / Team → invite or view roles  

## Acceptance

Sylvia H. signs off using `TASK1_ACCEPTANCE_CHECKLIST.md` section H.