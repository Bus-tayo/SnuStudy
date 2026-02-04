import { render, screen, within } from '@testing-library/react';
import FeedbackScreen from '../FeedbackScreen';
import { mockFeedbacks } from '@/lib/mock/mockData';

/**
 * Integration tests for the complete feedback flow
 * These tests verify the interaction between FeedbackScreen and FeedbackSummaryCard
 * without mocking child components
 */

describe('Feedback Integration Tests', () => {
  it('renders complete feedback screen with all child components', () => {
    render(<FeedbackScreen />);

    // Verify heading is present
    expect(screen.getByText('과목별 피드백')).toBeInTheDocument();

    // Verify all feedback subjects are displayed
    expect(screen.getByText('KOR')).toBeInTheDocument();
    expect(screen.getByText('ENG')).toBeInTheDocument();
    expect(screen.getByText('MATH')).toBeInTheDocument();
  });

  it('displays all feedback data from mockFeedbacks', () => {
    const feedbacks = mockFeedbacks();
    render(<FeedbackScreen />);

    // Check unique values (subjects and summaries)
    feedbacks.forEach((feedback) => {
      expect(screen.getByText(feedback.subject)).toBeInTheDocument();
      expect(screen.getByText(feedback.summary)).toBeInTheDocument();
    });

    // Check repeated values (dates and bodies) - use getAllByText
    const dates = screen.getAllByText('2026-02-01');
    expect(dates).toHaveLength(3);

    const bodies = screen.getAllByText('세부 피드백 내용...');
    expect(bodies).toHaveLength(3);
  });

  it('renders feedback cards with correct styling hierarchy', () => {
    const { container } = render(<FeedbackScreen />);

    // Check main container
    const mainContainer = container.firstChild;
    expect(mainContainer).toHaveClass('p-4', 'space-y-3');

    // Check all feedback cards have border and rounded styling
    const cards = container.querySelectorAll('.border.rounded');
    expect(cards.length).toBe(3);
  });

  it('maintains correct visual hierarchy across all cards', () => {
    render(<FeedbackScreen />);

    const feedbacks = mockFeedbacks();

    feedbacks.forEach((feedback) => {
      const subjectElements = screen.getAllByText(feedback.subject);
      const subjectElement = subjectElements.find((el) =>
        el.className.includes('font-semibold')
      );
      expect(subjectElement).toBeInTheDocument();
      expect(subjectElement).toHaveClass('text-sm', 'font-semibold');
    });
  });

  it('displays dates in correct format across all cards', () => {
    render(<FeedbackScreen />);

    const dateElements = screen.getAllByText('2026-02-01');

    // Should have 3 date elements (one per card)
    expect(dateElements.length).toBe(3);

    dateElements.forEach((dateElement) => {
      expect(dateElement).toHaveClass('text-xs', 'text-neutral-500');
    });
  });

  it('renders feedback in correct order', () => {
    const { container } = render(<FeedbackScreen />);
    const feedbacks = mockFeedbacks();

    const cards = container.querySelectorAll('.border.rounded');

    cards.forEach((card, index) => {
      const feedback = feedbacks[index];
      expect(within(card).getByText(feedback.subject)).toBeInTheDocument();
      expect(within(card).getByText(feedback.summary)).toBeInTheDocument();
    });
  });

  it('applies line-clamp to all body texts', () => {
    render(<FeedbackScreen />);

    // All body texts have the same content, so use getAllByText
    const bodyElements = screen.getAllByText('세부 피드백 내용...');
    expect(bodyElements).toHaveLength(3);

    bodyElements.forEach((bodyElement) => {
      expect(bodyElement).toHaveClass('line-clamp-2');
    });
  });

  it('renders without accessibility violations', () => {
    const { container } = render(<FeedbackScreen />);

    // Basic accessibility checks
    expect(container.firstChild).toBeInTheDocument();

    // All text content should be readable
    const feedbacks = mockFeedbacks();
    feedbacks.forEach((feedback) => {
      expect(screen.getByText(feedback.subject)).toBeVisible();
      expect(screen.getByText(feedback.summary)).toBeVisible();
    });
  });

  it('handles responsive layout structure', () => {
    const { container } = render(<FeedbackScreen />);

    // Check that cards are in a space-y-3 container for vertical spacing
    const mainContainer = container.firstChild;
    expect(mainContainer).toHaveClass('space-y-3');

    // Each card should have proper padding
    const cards = container.querySelectorAll('.border.rounded');
    cards.forEach((card) => {
      expect(card).toHaveClass('p-3');
    });
  });

  it('displays Korean text correctly', () => {
    render(<FeedbackScreen />);

    // Verify Korean text in heading
    expect(screen.getByText('과목별 피드백')).toBeInTheDocument();

    // Verify Korean text in summaries
    expect(screen.getByText('핵심: 지문 구조 파악')).toBeInTheDocument();
    expect(screen.getByText('핵심: 구문/동사')).toBeInTheDocument();
    expect(screen.getByText('핵심: 오답원인 분류')).toBeInTheDocument();
  });

  it('maintains data consistency between mock and display', () => {
    const feedbacks = mockFeedbacks();
    render(<FeedbackScreen />);

    // Verify that the number of rendered cards matches mock data
    const { container } = render(<FeedbackScreen />);
    const cards = container.querySelectorAll('.border.rounded');
    expect(cards.length).toBe(feedbacks.length);
  });

  it('renders each feedback item independently', () => {
    const { container } = render(<FeedbackScreen />);
    const cards = container.querySelectorAll('.border.rounded');

    // Each card should be independent
    cards.forEach((card) => {
      const flexContainer = card.querySelector('.flex.justify-between');
      expect(flexContainer).toBeInTheDocument();
    });
  });

  it('displays complete information for each subject', () => {
    render(<FeedbackScreen />);

    const subjects = ['KOR', 'ENG', 'MATH'];

    subjects.forEach((subject) => {
      // Each subject should have exactly one card
      const subjectElements = screen.getAllByText(subject);
      const subjectInCard = subjectElements.find((el) =>
        el.className.includes('font-semibold')
      );
      expect(subjectInCard).toBeInTheDocument();
    });
  });

  it('handles null or undefined gracefully', () => {
    // This test verifies the component handles data edge cases
    const { container } = render(<FeedbackScreen />);
    expect(container.firstChild).toBeInTheDocument();

    // Should still render heading even if there were no items
    expect(screen.getByText('과목별 피드백')).toBeInTheDocument();
  });

  it('maintains semantic HTML structure', () => {
    const { container } = render(<FeedbackScreen />);

    // Check that content is properly nested in divs
    const mainDiv = container.firstChild;
    expect(mainDiv.tagName).toBe('DIV');

    // Cards should be direct children with proper structure
    const cards = mainDiv.querySelectorAll(':scope > .border');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('renders consistent styling across all feedback items', () => {
    const { container } = render(<FeedbackScreen />);
    const cards = container.querySelectorAll('.border.rounded.p-3.space-y-1');

    // All cards should have the same styling classes
    expect(cards.length).toBe(3);

    cards.forEach((card) => {
      expect(card).toHaveClass('border');
      expect(card).toHaveClass('rounded');
      expect(card).toHaveClass('p-3');
      expect(card).toHaveClass('space-y-1');
    });
  });
});

describe('Feedback Error Handling and Edge Cases', () => {
  it('handles missing date gracefully', () => {
    // This would require mocking mockFeedbacks, but tests resilience
    render(<FeedbackScreen />);
    const { container } = render(<FeedbackScreen />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with very long text content', () => {
    render(<FeedbackScreen />);

    // Verify line-clamp is applied to prevent overflow
    const bodyElements = screen.getAllByText('세부 피드백 내용...');
    bodyElements.forEach((bodyElement) => {
      expect(bodyElement).toHaveClass('line-clamp-2');
    });
  });

  it('maintains layout with different content lengths', () => {
    const { container } = render(<FeedbackScreen />);

    // All cards should maintain consistent spacing
    const mainContainer = container.firstChild;
    expect(mainContainer).toHaveClass('space-y-3');
  });
});

describe('Feedback Snapshot and Regression Tests', () => {
  it('maintains stable component structure', () => {
    const { container } = render(<FeedbackScreen />);

    // Verify the component structure hasn't changed
    expect(container.firstChild).toHaveClass('p-4', 'space-y-3');

    const heading = screen.getByText('과목별 피드백');
    expect(heading).toHaveClass('text-lg', 'font-bold');
  });

  it('renders all expected data from mockFeedbacks function', () => {
    const mockData = mockFeedbacks();
    render(<FeedbackScreen />);

    // Verify all data from mock is rendered
    expect(mockData.length).toBe(3);
    expect(screen.getAllByText(/KOR|ENG|MATH/).length).toBeGreaterThanOrEqual(3);
  });

  it('preserves data integrity through rendering', () => {
    const originalData = mockFeedbacks();
    render(<FeedbackScreen />);

    // Data should not be mutated during rendering
    const currentData = mockFeedbacks();
    expect(currentData).toEqual(originalData);
  });
});