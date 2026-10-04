import {
  layoutPortChips,
  monoCharWidth,
  networkGeometry,
  networkLabelWidth,
  networkSize,
  serviceGeometry,
  serviceSize,
  truncate,
  volumeGeometry,
  volumeSize,
} from './node-geometry';

describe('node geometry', () => {
  describe('truncate', () => {
    it('keeps text that fits', () => {
      expect(truncate('api', 100, 10)).toBe('api');
    });

    it('cuts text that does not fit and marks the cut', () => {
      expect(truncate('ghcr.io/acme/api', 60, 10)).toBe('ghcr.…');
    });

    it('keeps text that fits exactly despite floating point noise', () => {
      // 9 chars at 6.3 px = 56.7 px, but 56.7 / 6.3 evaluates to 8.999…
      expect(truncate('8080:8080', 56.7, 6.3)).toBe('8080:8080');
    });
  });

  describe('monoCharWidth', () => {
    it('uses the 0.6 em advance of JetBrains Mono', () => {
      expect(monoCharWidth(10.5)).toBeCloseTo(6.3);
    });
  });

  describe('serviceSize', () => {
    it('is compact without ports', () => {
      expect(serviceSize([])).toEqual({ width: 196, height: 58 });
    });

    it('adds one chip row for ports that fit on a line', () => {
      expect(serviceSize(['443:443', '80:80'])).toEqual({ width: 196, height: 76 });
    });

    it('grows by one row per wrapped line of chips', () => {
      // Two of these fit on a line, the third wraps.
      const ports = ['3000:3000', '3001:3001', '3002:3002'];
      const g = serviceGeometry;

      expect(serviceSize(ports).height).toBe(76 + g.chipHeight + g.chipGap);
    });
  });

  describe('layoutPortChips', () => {
    it('places chips left to right inside the padding', () => {
      const [first, second] = layoutPortChips(['443:443', '80:80']);

      expect(first?.x).toBe(serviceGeometry.paddingX);
      expect(second?.x).toBeGreaterThan((first?.x ?? 0) + (first?.width ?? 0));
      expect(second?.y).toBe(first?.y);
    });

    it('wraps a chip that would cross the right edge', () => {
      const chips = layoutPortChips(['3000:3000', '3001:3001', '3002:3002']);
      const right = serviceGeometry.width - serviceGeometry.paddingX;

      for (const chip of chips) {
        expect(chip.x + chip.width).toBeLessThanOrEqual(right);
      }
      expect(chips[2]?.y).toBeGreaterThan(chips[0]?.y ?? 0);
    });

    it('never makes a single chip wider than the content area', () => {
      const [chip] = layoutPortChips(['127.0.0.1:65535:65535/udp-and-then-some']);

      expect(chip?.width).toBe(serviceGeometry.width - 2 * serviceGeometry.paddingX);
    });
  });

  describe('networkSize and volumeSize', () => {
    it('use the minimum width for short names', () => {
      expect(networkSize('edge')).toEqual({ width: 96, height: networkGeometry.height });
      expect(volumeSize('data')).toEqual({ width: 100, height: volumeGeometry.height });
    });

    it('grow with longer names', () => {
      expect(networkSize('backend-internal').width).toBeGreaterThan(96);
      expect(volumeSize('postgres-data-primary').width).toBeGreaterThan(100);
    });

    it('stop growing at the maximum width', () => {
      const long = 'a-network-name-that-goes-on-and-on-and-on';

      expect(networkSize(long).width).toBe(networkGeometry.maxWidth);
      expect(volumeSize(long).width).toBe(volumeGeometry.maxWidth);
    });

    it('leave room for the label between the slanted sides', () => {
      const { width } = networkSize('backend');

      expect(networkLabelWidth(width)).toBe(
        width - 2 * (networkGeometry.slant + networkGeometry.paddingX)
      );
    });
  });
});
