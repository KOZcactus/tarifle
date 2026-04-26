import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getPermissionState,
  playBeep,
  requestPermission,
  showNotification,
} from "@/lib/recipe/notifications";

describe("notifications, SSR/unsupported guards", () => {
  it("getPermissionState 'unsupported' when Notification missing", () => {
    const original = globalThis.Notification;
    // @ts-expect-error: simulate missing API
    delete globalThis.Notification;
    expect(getPermissionState()).toBe("unsupported");
    if (original !== undefined) {
      globalThis.Notification = original;
    }
  });

  it("requestPermission 'unsupported' when Notification missing", async () => {
    const original = globalThis.Notification;
    // @ts-expect-error: simulate missing API
    delete globalThis.Notification;
    const result = await requestPermission();
    expect(result).toBe("unsupported");
    if (original !== undefined) {
      globalThis.Notification = original;
    }
  });

  it("showNotification no-throw when Notification missing", () => {
    const original = globalThis.Notification;
    // @ts-expect-error: simulate missing API
    delete globalThis.Notification;
    expect(() => showNotification("test")).not.toThrow();
    if (original !== undefined) {
      globalThis.Notification = original;
    }
  });

  it("playBeep no-throw when AudioContext missing", () => {
    const original = (window as unknown as { AudioContext?: unknown }).AudioContext;
    (window as unknown as { AudioContext?: unknown }).AudioContext = undefined;
    expect(() => playBeep()).not.toThrow();
    (window as unknown as { AudioContext?: unknown }).AudioContext = original;
  });
});

describe("notifications, granted permission flow", () => {
  let originalNotification: typeof Notification | undefined;
  let constructed: { title: string; options: NotificationOptions | undefined } | null = null;

  beforeEach(() => {
    originalNotification = globalThis.Notification;
    constructed = null;
    const MockNotification = vi.fn(function (
      this: object,
      title: string,
      options: NotificationOptions | undefined,
    ) {
      constructed = { title, options };
      Object.assign(this, { close: vi.fn() });
    }) as unknown as typeof Notification;
    Object.defineProperty(MockNotification, "permission", {
      value: "granted",
      writable: true,
      configurable: true,
    });
    Object.defineProperty(MockNotification, "requestPermission", {
      value: vi.fn().mockResolvedValue("granted"),
      writable: true,
      configurable: true,
    });
    globalThis.Notification = MockNotification;
  });

  afterEach(() => {
    if (originalNotification !== undefined) {
      globalThis.Notification = originalNotification;
    } else {
      // @ts-expect-error: restoring undefined removes the global
      delete globalThis.Notification;
    }
  });

  it("getPermissionState returns 'granted'", () => {
    expect(getPermissionState()).toBe("granted");
  });

  it("requestPermission returns 'granted' (already granted)", async () => {
    expect(await requestPermission()).toBe("granted");
  });

  it("showNotification constructs Notification with title + body", () => {
    showNotification("Tarif zamanlayıcı", {
      body: "Adım 3 bitti",
      tag: "recipe-timer-3",
    });
    expect(constructed).not.toBeNull();
    expect(constructed?.title).toBe("Tarif zamanlayıcı");
    expect(constructed?.options?.body).toBe("Adım 3 bitti");
    expect(constructed?.options?.tag).toBe("recipe-timer-3");
  });
});

describe("notifications, denied permission", () => {
  let originalNotification: typeof Notification | undefined;

  beforeEach(() => {
    originalNotification = globalThis.Notification;
    const Mock = function () {} as unknown as typeof Notification;
    Object.defineProperty(Mock, "permission", {
      value: "denied",
      writable: true,
      configurable: true,
    });
    Object.defineProperty(Mock, "requestPermission", {
      value: vi.fn().mockResolvedValue("denied"),
      writable: true,
      configurable: true,
    });
    globalThis.Notification = Mock;
  });

  afterEach(() => {
    if (originalNotification !== undefined) {
      globalThis.Notification = originalNotification;
    } else {
      // @ts-expect-error: restoring undefined removes the global
      delete globalThis.Notification;
    }
  });

  it("showNotification noop when permission denied", () => {
    expect(() => showNotification("test")).not.toThrow();
  });

  it("requestPermission returns 'denied'", async () => {
    expect(await requestPermission()).toBe("denied");
  });
});
