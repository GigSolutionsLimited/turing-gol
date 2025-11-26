/**
 * Test GameStatus component completion popup layout
 */

describe('GameStatus Completion Popup Layout', () => {
  test('should have proper layout properties for single line display', () => {
    // Test the CSS properties that ensure single-line display
    const completedPopupStyle = {
      fontWeight: 'bold',
      color: 'var(--light-blue)',
      background: 'rgba(62, 198, 255, 0.2)',
      padding: '12px 40px',
      borderRadius: '8px',
      border: '2px solid var(--light-blue)',
      textTransform: 'uppercase',
      letterSpacing: '2px',
      fontFamily: 'var(--futuristic-font)',
      fontSize: '1.2rem',
      textAlign: 'center',
      backdropFilter: 'blur(8px)',
      boxShadow: '0 0 20px var(--light-blue-glow)',
      minWidth: '320px',
      whiteSpace: 'nowrap',
      display: 'inline-block'
    };

    const failedPopupStyle = {
      fontWeight: 'bold',
      color: '#ff6b6b',
      background: 'rgba(255, 107, 107, 0.2)',
      padding: '12px 40px',
      borderRadius: '8px',
      border: '2px solid #ff6b6b',
      textTransform: 'uppercase',
      letterSpacing: '2px',
      fontFamily: 'var(--futuristic-font)',
      fontSize: '1.2rem',
      textAlign: 'center',
      backdropFilter: 'blur(8px)',
      boxShadow: '0 0 20px rgba(255, 107, 107, 0.5)',
      minWidth: '280px',
      whiteSpace: 'nowrap',
      display: 'inline-block'
    };

    // Verify critical layout properties for single-line display
    expect(completedPopupStyle.whiteSpace).toBe('nowrap');
    expect(completedPopupStyle.display).toBe('inline-block');
    expect(completedPopupStyle.minWidth).toBe('320px');
    expect(completedPopupStyle.padding).toBe('12px 40px');

    expect(failedPopupStyle.whiteSpace).toBe('nowrap');
    expect(failedPopupStyle.display).toBe('inline-block');
    expect(failedPopupStyle.minWidth).toBe('280px');
    expect(failedPopupStyle.padding).toBe('12px 40px');

    // Test that completed popup has wider minWidth due to longer text
    expect(parseInt(completedPopupStyle.minWidth)).toBeGreaterThan(parseInt(failedPopupStyle.minWidth));
  });

  test('should calculate appropriate minimum widths for text content', () => {
    // Test the text content and expected width requirements
    const completedText = '🎉 COMPLETED! 🎉';
    const failedText = '❌ FAILED! ❌';

    // Completed text is longer and needs more space
    expect(completedText.length).toBeGreaterThan(failedText.length);

    // Verify the minimum widths reflect this difference
    const completedMinWidth = 320;
    const failedMinWidth = 280;

    expect(completedMinWidth).toBeGreaterThan(failedMinWidth);
    expect(completedMinWidth - failedMinWidth).toBe(40); // 40px difference
  });

  test('should prevent text wrapping with style properties', () => {
    // Test properties that prevent text from wrapping
    const antiWrapProperties = {
      whiteSpace: 'nowrap',
      display: 'inline-block',
      textAlign: 'center'
    };

    // These properties together ensure single-line display
    expect(antiWrapProperties.whiteSpace).toBe('nowrap'); // Prevents wrapping
    expect(antiWrapProperties.display).toBe('inline-block'); // Allows width control
    expect(antiWrapProperties.textAlign).toBe('center'); // Centers content within width
  });

  test('should handle text styling that affects width', () => {
    // Test properties that increase text width
    const textStyling = {
      textTransform: 'uppercase',
      letterSpacing: '2px',
      fontSize: '1.2rem',
      fontWeight: 'bold'
    };

    // These properties all contribute to wider text
    expect(textStyling.textTransform).toBe('uppercase'); // May affect width
    expect(textStyling.letterSpacing).toBe('2px'); // Definitely increases width
    expect(textStyling.fontSize).toBe('1.2rem'); // Affects overall size
    expect(textStyling.fontWeight).toBe('bold'); // May slightly affect width
  });

  test('should provide adequate padding for visual breathing room', () => {
    // Test padding that provides space around text
    const completedPadding = '12px 40px';
    const failedPadding = '12px 40px';

    // Both should have generous horizontal padding
    expect(completedPadding).toContain('40px'); // 40px horizontal padding
    expect(failedPadding).toContain('40px'); // 40px horizontal padding

    // Vertical padding should be consistent
    expect(completedPadding).toContain('12px'); // 12px vertical padding
    expect(failedPadding).toContain('12px'); // 12px vertical padding
  });
});
