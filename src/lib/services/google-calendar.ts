import { google, calendar_v3 } from 'googleapis';
import { GoogleClientService } from './google-client';
import { logIntegrationAction } from '../firebase/google-integrations';
import { updateTask } from '../firebase/firestore';

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  location?: string;
  hangoutLink?: string;
  htmlLink: string;
  status: string;
  created: string;
  updated: string;
}

export interface TaskEventLink {
  taskId: string;
  eventId: string;
  eventTitle: string;
  attendees: string[];
  meetingLink?: string;
  location?: string;
}

export class GoogleCalendarService {
  private static async getCalendarClient(userId: string) {
    const auth = await GoogleClientService.getAuthenticatedClient(userId);
    return google.calendar({ version: 'v3', auth });
  }

  static async syncEvents(userId: string, timeMin?: Date, timeMax?: Date): Promise<CalendarEvent[]> {
    try {
      const calendar = await this.getCalendarClient(userId);
      
      const response = await GoogleClientService.withRetry(async () => {
        return calendar.events.list({
          calendarId: 'primary',
          timeMin: (timeMin || new Date()).toISOString(),
          timeMax: timeMax?.toISOString(),
          singleEvents: true,
          orderBy: 'startTime',
          maxResults: 100,
        });
      });

      const events: CalendarEvent[] = (response.data.items || []).map(event => ({
        id: event.id!,
        summary: event.summary || 'Untitled Event',
        description: event.description,
        start: {
          dateTime: event.start?.dateTime,
          date: event.start?.date,
          timeZone: event.start?.timeZone,
        },
        end: {
          dateTime: event.end?.dateTime,
          date: event.end?.date,
          timeZone: event.end?.timeZone,
        },
        attendees: event.attendees?.map(attendee => ({
          email: attendee.email!,
          displayName: attendee.displayName,
          responseStatus: attendee.responseStatus,
        })) || [],
        location: event.location,
        hangoutLink: event.hangoutLink,
        htmlLink: event.htmlLink!,
        status: event.status!,
        created: event.created!,
        updated: event.updated!,
      }));

      await logIntegrationAction(
        userId,
        'sync_events',
        'calendar',
        'success',
        undefined,
        { eventsCount: events.length }
      );

      return events;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await logIntegrationAction(userId, 'sync_events', 'calendar', 'error', errorMessage);
      throw error;
    }
  }

  static async createEventFromTask(
    userId: string,
    taskId: string,
    eventDetails: {
      summary: string;
      description?: string;
      start: Date;
      end: Date;
      attendees?: string[];
      location?: string;
    }
  ): Promise<TaskEventLink> {
    try {
      const calendar = await this.getCalendarClient(userId);
      
      const eventResource: calendar_v3.Schema$Event = {
        summary: eventDetails.summary,
        description: eventDetails.description,
        start: {
          dateTime: eventDetails.start.toISOString(),
          timeZone: 'UTC', // Could be made configurable per user
        },
        end: {
          dateTime: eventDetails.end.toISOString(),
          timeZone: 'UTC',
        },
        attendees: eventDetails.attendees?.map(email => ({ email })),
        location: eventDetails.location,
        conferenceData: {
          createRequest: {
            requestId: `task-${taskId}-${Date.now()}`,
            conferenceSolutionKey: {
              type: 'hangoutsMeet',
            },
          },
        },
      };

      const response = await GoogleClientService.withRetry(async () => {
        return calendar.events.insert({
          calendarId: 'primary',
          resource: eventResource,
          conferenceDataVersion: 1,
        });
      });

      const createdEvent = response.data;
      if (!createdEvent.id) {
        throw new Error('Failed to create calendar event');
      }

      // Update task with calendar event link
      await updateTask(taskId, {
        calendarEventId: createdEvent.id,
        integrationMeta: {
          calendar: {
            eventTitle: createdEvent.summary || eventDetails.summary,
            attendees: eventDetails.attendees || [],
            meetingLink: createdEvent.hangoutLink,
            location: eventDetails.location,
            lastSynced: new Date(),
          },
        },
      });

      const taskEventLink: TaskEventLink = {
        taskId,
        eventId: createdEvent.id,
        eventTitle: createdEvent.summary || eventDetails.summary,
        attendees: eventDetails.attendees || [],
        meetingLink: createdEvent.hangoutLink,
        location: eventDetails.location,
      };

      await logIntegrationAction(
        userId,
        'create_event',
        'calendar',
        'success',
        undefined,
        { taskId, eventId: createdEvent.id }
      );

      return taskEventLink;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await logIntegrationAction(
        userId,
        'create_event',
        'calendar',
        'error',
        errorMessage,
        { taskId }
      );
      throw error;
    }
  }

  static async linkTaskToEvent(
    userId: string,
    taskId: string,
    eventId: string
  ): Promise<TaskEventLink> {
    try {
      const calendar = await this.getCalendarClient(userId);
      
      // Get event details
      const response = await GoogleClientService.withRetry(async () => {
        return calendar.events.get({
          calendarId: 'primary',
          eventId,
        });
      });

      const event = response.data;
      if (!event.id) {
        throw new Error('Event not found');
      }

      // Update task with calendar event link
      await updateTask(taskId, {
        calendarEventId: event.id,
        integrationMeta: {
          calendar: {
            eventTitle: event.summary || 'Untitled Event',
            attendees: event.attendees?.map(a => a.email!) || [],
            meetingLink: event.hangoutLink,
            location: event.location,
            lastSynced: new Date(),
          },
        },
      });

      const taskEventLink: TaskEventLink = {
        taskId,
        eventId: event.id,
        eventTitle: event.summary || 'Untitled Event',
        attendees: event.attendees?.map(a => a.email!) || [],
        meetingLink: event.hangoutLink,
        location: event.location,
      };

      await logIntegrationAction(
        userId,
        'link_task_event',
        'calendar',
        'success',
        undefined,
        { taskId, eventId }
      );

      return taskEventLink;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await logIntegrationAction(
        userId,
        'link_task_event',
        'calendar',
        'error',
        errorMessage,
        { taskId, eventId }
      );
      throw error;
    }
  }

  static async updateEventFromTask(
    userId: string,
    taskId: string,
    eventId: string,
    updates: {
      summary?: string;
      description?: string;
      start?: Date;
      end?: Date;
      status?: string;
    }
  ): Promise<void> {
    try {
      const calendar = await this.getCalendarClient(userId);
      
      // First get the current event
      const currentEvent = await GoogleClientService.withRetry(async () => {
        return calendar.events.get({
          calendarId: 'primary',
          eventId,
        });
      });

      const updateResource: calendar_v3.Schema$Event = {
        ...currentEvent.data,
      };

      // Apply updates
      if (updates.summary) updateResource.summary = updates.summary;
      if (updates.description) updateResource.description = updates.description;
      if (updates.start) {
        updateResource.start = {
          ...updateResource.start,
          dateTime: updates.start.toISOString(),
        };
      }
      if (updates.end) {
        updateResource.end = {
          ...updateResource.end,
          dateTime: updates.end.toISOString(),
        };
      }
      if (updates.status) updateResource.status = updates.status;

      await GoogleClientService.withRetry(async () => {
        return calendar.events.update({
          calendarId: 'primary',
          eventId,
          resource: updateResource,
        });
      });

      // Update task integration meta
      await updateTask(taskId, {
        integrationMeta: {
          calendar: {
            eventTitle: updateResource.summary || 'Untitled Event',
            lastSynced: new Date(),
          },
        },
      });

      await logIntegrationAction(
        userId,
        'update_event',
        'calendar',
        'success',
        undefined,
        { taskId, eventId, updates: Object.keys(updates) }
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await logIntegrationAction(
        userId,
        'update_event',
        'calendar',
        'error',
        errorMessage,
        { taskId, eventId }
      );
      throw error;
    }
  }

  static async deleteEventLink(
    userId: string,
    taskId: string,
    eventId: string,
    deleteEvent = false
  ): Promise<void> {
    try {
      // Optionally delete the calendar event
      if (deleteEvent) {
        const calendar = await this.getCalendarClient(userId);
        await GoogleClientService.withRetry(async () => {
          return calendar.events.delete({
            calendarId: 'primary',
            eventId,
          });
        });
      }

      // Remove calendar link from task
      await updateTask(taskId, {
        calendarEventId: undefined,
        integrationMeta: {
          calendar: undefined,
        },
      });

      await logIntegrationAction(
        userId,
        'delete_event_link',
        'calendar',
        'success',
        undefined,
        { taskId, eventId, deletedEvent: deleteEvent }
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await logIntegrationAction(
        userId,
        'delete_event_link',
        'calendar',
        'error',
        errorMessage,
        { taskId, eventId }
      );
      throw error;
    }
  }
}