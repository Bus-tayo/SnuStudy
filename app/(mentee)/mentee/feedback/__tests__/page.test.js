import { render, screen } from '@testing-library/react';
import FeedbackPage from '../page';

// Mock the FeedbackScreen component
jest.mock('@/components/mentee/feedback/FeedbackScreen', () => {
  return function MockFeedbackScreen() {
    return <div data-testid="feedback-screen">Mocked FeedbackScreen</div>;
  };
});

describe('FeedbackPage', () => {
  it('renders without crashing', () => {
    render(<FeedbackPage />);
    expect(screen.getByTestId('feedback-screen')).toBeInTheDocument();
  });

  it('renders the FeedbackScreen component', () => {
    render(<FeedbackPage />);
    expect(screen.getByText('Mocked FeedbackScreen')).toBeInTheDocument();
  });

  it('is a valid React component', () => {
    const component = <FeedbackPage />;
    expect(component).toBeTruthy();
    expect(typeof FeedbackPage).toBe('function');
  });

  it('has the correct component name', () => {
    expect(FeedbackPage.name).toBe('FeedbackPage');
  });

  it('returns a valid React element', () => {
    const result = FeedbackPage();
    expect(result).toBeTruthy();
    expect(result.type).toBeTruthy();
  });
});