import { InsertFeedback } from '@shared/schema';
 
export function useFeedback() {
  const addFeedbackItem = async (title: string) => {
    const newItem: InsertFeedback = {
      title,
    };

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newItem),
      });

      if (response.ok) {
        const createdItem = await response.json();
        return createdItem;
      }
    } catch (error) {
      console.error('Error creating feedback item:', error);
    }
  };

  return {
    addFeedbackItem,
  };
}
