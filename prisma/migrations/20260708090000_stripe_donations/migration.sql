-- Generalize Donation for Stripe: rename the PayPal-specific reference column
-- and record which provider handled each donation.
ALTER TABLE "Donation" RENAME COLUMN "paypalOrderId" TO "providerRef";
ALTER INDEX "Donation_paypalOrderId_key" RENAME TO "Donation_providerRef_key";
ALTER TABLE "Donation" ADD COLUMN "provider" TEXT NOT NULL DEFAULT 'stripe';

-- Donations that predate this migration came through PayPal.
UPDATE "Donation" SET "provider" = 'paypal';
