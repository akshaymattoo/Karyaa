import { useState } from 'react';
import { MessageCircleQuestionIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface FeedbackModalProps {
  onAddItem: (title: string) => Promise<void> | void;
}

const FeedbackModal = ({ onAddItem }: FeedbackModalProps) => {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedFeedback = feedback.trim();

    if (!trimmedFeedback) {
      setError('Please add a little detail before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      await Promise.resolve(onAddItem(trimmedFeedback));
      setFeedback('');
      setError(null);
      setOpen(false);
    } catch (submitError) {
      console.error('Failed to submit feedback:', submitError);
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          className="fixed bottom-6 left-6 z-40 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:h-14 sm:w-14"
          variant="default"
        >
          <MessageCircleQuestionIcon className="h-6 w-6" />
          <span className="sr-only">Share feedback</span>
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share your thoughts</DialogTitle>
          <DialogDescription>
            Let us know what’s working well or what could be improved.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="feedback-message">Your feedback</Label>
            <Textarea
              id="feedback-message"
              value={feedback}
              onChange={(event) => {
                setFeedback(event.target.value);
                if (error) {
                  setError(null);
                }
              }}
              placeholder="Drop a quick note…"
              disabled={submitting}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button
              type="submit"
              className="w-full sm:w-auto"
              disabled={submitting}
            >
              {submitting ? 'Sending...' : 'Submit feedback'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackModal;
