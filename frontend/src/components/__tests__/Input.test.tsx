import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../ui/Input';

describe('Input', () => {
  it('renders input with label', () => {
    render(<Input label="Test Input" />);
    expect(screen.getByLabelText(/test input/i)).toBeInTheDocument();
  });

  it('handles value changes', async () => {
    const user = userEvent.setup();
    render(<Input label="Test Input" />);
    
    const input = screen.getByLabelText(/test input/i);
    await user.type(input, 'test value');
    expect(input).toHaveValue('test value');
  });

  it('displays error message', () => {
    render(<Input label="Test Input" error="This is an error" />);
    expect(screen.getByRole('alert')).toHaveTextContent(/this is an error/i);
    expect(screen.getByLabelText(/test input/i)).toHaveAttribute('aria-invalid', 'true');
  });

  it('displays helper text', () => {
    render(<Input label="Test Input" helperText="This is helpful" />);
    expect(screen.getByText(/this is helpful/i)).toBeInTheDocument();
  });

  it('associates label with input', () => {
    render(<Input label="Test Input" id="test-id" />);
    const input = screen.getByLabelText(/test input/i);
    expect(input).toHaveAttribute('id', 'test-id');
  });
});
