import { describe, it, expect } from "vitest";
import { testimonials } from "../testimonials";
import fs from "fs";
import path from "path";

describe("Testimonials Data Integrity", () => {
  it("should contain valid testimonial entries", () => {
    expect(testimonials).toBeDefined();
    expect(Array.isArray(testimonials)).toBe(true);
    expect(testimonials.length).toBeGreaterThan(0);
  });

  it("should have required fields on every testimonial", () => {
    testimonials.forEach((item) => {
      expect(item.id).toBeTruthy();
      expect(item.name).toBeTruthy();
      expect(item.role).toBeTruthy();
      expect(item.avatar).toBeTruthy();
      expect(item.quote).toBeTruthy();
    });
  });

  it("should reference local image files for avatars and logos", () => {
    testimonials.forEach((item) => {
      // Must start with '/' indicating local public asset
      expect(item.avatar.startsWith("/")).toBe(true);
      expect(item.avatar).not.toContain("http://");
      expect(item.avatar).not.toContain("https://");
      expect(item.avatar).not.toContain("framerusercontent.com");

      // Verify file existence in public folder
      const relativePath = item.avatar.replace(/^\//, "");
      const fullPath = path.join(process.cwd(), "public", relativePath);
      expect(fs.existsSync(fullPath)).toBe(true);

      if (item.companyLogo) {
        expect(item.companyLogo.startsWith("/")).toBe(true);
        expect(item.companyLogo).not.toContain("framerusercontent.com");
        const logoPath = path.join(
          process.cwd(),
          "public",
          item.companyLogo.replace(/^\//, "")
        );
        expect(fs.existsSync(logoPath)).toBe(true);
      }
    });
  });

  it("should not contain references to reference/source brands in testimonial content", () => {
    const forbiddenBrands = [
      "Mobbin",
      "Framer",
      "Visa",
      "Figma",
      "Endless",
      "DesignCode",
      "Compound Labs",
      "Plaid",
      "Heart Hands",
      "Daybreak",
    ];

    testimonials.forEach((item) => {
      const fullContent = `${item.name} ${item.role} ${item.company || ""} ${
        item.quote
      }`;
      forbiddenBrands.forEach((brand) => {
        expect(fullContent.toLowerCase()).not.toContain(brand.toLowerCase());
      });
    });
  });
});
