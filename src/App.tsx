import { useState } from 'react';
import styled from 'styled-components';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface Task {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  archivedAt?: Date;
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

const AppContainer = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: Arial, sans-serif;
`;

const Board = styled.div`
  display: flex;
  gap: 20px;
  margin-top: 20px;
  flex-wrap: wrap;
`;

const ColumnContainer = styled.div`
  background-color: #f4f5f7;
  border-radius: 8px;
  width: 300px;
  min-height: 500px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const ColumnTitle = styled.h2`
  padding: 10px;
  margin: 0;
  color: #172b4d;
  font-size: 18px;
  border-bottom: 2px solid #dfe1e6;
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const TaskCount = styled.span`
  font-size: 14px;
  color: #5e6c84;
  font-weight: normal;
`;

const TaskCard = styled.div`
  background-color: white;
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  transition: transform 0.2s ease;
  cursor: grab;
  position: relative;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
  }
`;

const TaskTitle = styled.h3`
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #172b4d;
`;

const TaskDescription = styled.p`
  margin: 0;
  font-size: 14px;
  color: #5e6c84;
`;

const TaskDate = styled.div`
  font-size: 12px;
  color: #5e6c84;
  margin-top: 8px;
`;

const AddTaskButton = styled.button`
  background-color: #0052cc;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 12px;
  width: 100%;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #0747a6;
  }
`;

const ArchiveButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  background-color: #ff5630;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.2s ease;

  ${TaskCard}:hover & {
    opacity: 1;
  }

  &:hover {
    background-color: #ff4d1c;
  }
`;

const ArchivedTasksToggle = styled.button`
  background-color: #dfe1e6;
  color: #172b4d;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 20px;
  font-size: 14px;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #c1c7d0;
  }
`;

const PageTitle = styled.h1`
  color: #172b4d;
  text-align: center;
  margin-bottom: 32px;
  font-size: 28px;
`;

const DeleteButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  background-color: #ff5630;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.2s ease;

  ${TaskCard}:hover & {
    opacity: 1;
  }

  &:hover {
    background-color: #ff4d1c;
  }
`;

const ConfirmDialog = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  text-align: center;
  max-width: 400px;
  width: 90%;
`;

const DialogOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
`;

const DialogButtons = styled.div`
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
`;

const DialogButton = styled.button`
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s ease;

  &.confirm {
    background-color: #ff5630;
    color: white;

    &:hover {
      background-color: #ff4d1c;
    }
  }

  &.cancel {
    background-color: #dfe1e6;
    color: #172b4d;

    &:hover {
      background-color: #c1c7d0;
    }
  }
`;

function App() {
  const [columns, setColumns] = useState<Column[]>([
    {
      id: 'todo',
      title: 'Por Hacer',
      tasks: []
    },
    {
      id: 'in-progress',
      title: 'En Progreso',
      tasks: []
    },
    {
      id: 'done',
      title: 'Completadas',
      tasks: []
    }
  ]);

  const [archivedTasks, setArchivedTasks] = useState<Task[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    show: boolean;
    taskId: string | null;
  }>({
    show: false,
    taskId: null
  });

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination } = result;
    const sourceColumn = columns.find(col => col.id === source.droppableId);
    const destColumn = columns.find(col => col.id === destination.droppableId);
    
    if (!sourceColumn || !destColumn) return;
    
    const sourceTasks = [...sourceColumn.tasks];
    const destTasks = sourceColumn === destColumn ? sourceTasks : [...destColumn.tasks];
    
    const [removed] = sourceTasks.splice(source.index, 1);
    destTasks.splice(destination.index, 0, removed);

    setColumns(columns.map(col => {
      if (col.id === source.droppableId) {
        return { ...col, tasks: sourceTasks };
      }
      if (col.id === destination.droppableId) {
        return { ...col, tasks: destTasks };
      }
      return col;
    }));
  };

  const addTask = (columnId: string) => {
    const taskTitle = prompt('Título de la tarea:') || 'Nueva Tarea';
    const taskDescription = prompt('Descripción de la tarea:') || 'Sin descripción';

    const newTask: Task = {
      id: Date.now().toString(),
      title: taskTitle,
      description: taskDescription,
      createdAt: new Date()
    };

    setColumns(columns.map(col => {
      if (col.id === columnId) {
        return { ...col, tasks: [...col.tasks, newTask] };
      }
      return col;
    }));
  };

  const archiveTask = (taskId: string) => {
    const doneColumn = columns.find(col => col.id === 'done');
    if (!doneColumn) return;

    const taskToArchive = doneColumn.tasks.find(task => task.id === taskId);
    if (!taskToArchive) return;

    // Agregar la tarea a las archivadas
    setArchivedTasks([...archivedTasks, { ...taskToArchive, archivedAt: new Date() }]);

    // Remover la tarea de la columna "Completadas"
    setColumns(columns.map(col => {
      if (col.id === 'done') {
        return {
          ...col,
          tasks: col.tasks.filter(task => task.id !== taskId)
        };
      }
      return col;
    }));
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleDeleteClick = (taskId: string) => {
    setDeleteConfirmation({
      show: true,
      taskId
    });
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirmation.taskId) {
      setArchivedTasks(archivedTasks.filter(task => task.id !== deleteConfirmation.taskId));
      setDeleteConfirmation({ show: false, taskId: null });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmation({ show: false, taskId: null });
  };

  return (
    <AppContainer>
      <PageTitle>Mi Gestor de Tareas</PageTitle>
      <DragDropContext onDragEnd={onDragEnd}>
        <Board>
          {columns.map(column => (
            <ColumnContainer key={column.id}>
              <ColumnTitle>
                {column.title}
                <TaskCount>{column.tasks.length} tareas</TaskCount>
              </ColumnTitle>
              <Droppable droppableId={column.id}>
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    style={{ minHeight: '400px' }}
                  >
                    {column.tasks.map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={index}
                      >
                        {(provided) => (
                          <TaskCard
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <TaskTitle>{task.title}</TaskTitle>
                            <TaskDescription>{task.description}</TaskDescription>
                            <TaskDate>Creada: {formatDate(task.createdAt)}</TaskDate>
                            {column.id === 'done' && (
                              <ArchiveButton onClick={() => archiveTask(task.id)}>
                                Archivar
                              </ArchiveButton>
                            )}
                          </TaskCard>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
              <AddTaskButton onClick={() => addTask(column.id)}>
                + Agregar Tarea
              </AddTaskButton>
            </ColumnContainer>
          ))}

          {/* Columna de Tareas Archivadas */}
          <ColumnContainer>
            <ColumnTitle>
              Archivadas
              <TaskCount>{archivedTasks.length} tareas</TaskCount>
            </ColumnTitle>
            <div style={{ minHeight: '400px' }}>
              {archivedTasks.map(task => (
                <TaskCard key={task.id}>
                  <TaskTitle>{task.title}</TaskTitle>
                  <TaskDescription>{task.description}</TaskDescription>
                  <TaskDate>
                    Creada: {formatDate(task.createdAt)}
                    <br />
                    Archivada: {task.archivedAt && formatDate(task.archivedAt)}
                  </TaskDate>
                  <DeleteButton onClick={() => handleDeleteClick(task.id)}>
                    Eliminar
                  </DeleteButton>
                </TaskCard>
              ))}
            </div>
          </ColumnContainer>
        </Board>
      </DragDropContext>

      {/* Diálogo de confirmación */}
      {deleteConfirmation.show && (
        <>
          <DialogOverlay onClick={handleDeleteCancel} />
          <ConfirmDialog>
            <h3>¿Estás seguro?</h3>
            <p>Esta acción no se puede deshacer. ¿Deseas eliminar esta tarea?</p>
            <DialogButtons>
              <DialogButton className="cancel" onClick={handleDeleteCancel}>
                Cancelar
              </DialogButton>
              <DialogButton className="confirm" onClick={handleDeleteConfirm}>
                Eliminar
              </DialogButton>
            </DialogButtons>
          </ConfirmDialog>
        </>
      )}
    </AppContainer>
  );
}

export default App;
