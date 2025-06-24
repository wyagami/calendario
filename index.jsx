import React, { useState, useEffect, useCallback } from 'react';

// IndexedDB Utility - indexedDBService.js
const DB_NAME = 'calendarDB';
const STORE_NAME = 'tasks';
const DB_VERSION = 1;

/**
 * Opens the IndexedDB database.
 * @returns {Promise<IDBDatabase>} A promise that resolves with the database instance.
 */
const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onerror = (event) => {
            console.error('Erro ao abrir o IndexedDB:', event.target.error);
            reject(event.target.error);
        };
    });
};

/**
 * Adds a new task to IndexedDB.
 * @param {object} task - The task object to add.
 * @returns {Promise<object>} A promise that resolves with the added task (with its ID).
 */
const addTask = async (task) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.add(task);

        request.onsuccess = (event) => {
            resolve({ ...task, id: event.target.result });
        };

        request.onerror = (event) => {
            console.error('Erro ao adicionar tarefa:', event.target.error);
            reject(event.target.error);
        };
    });
};

/**
 * Retrieves all tasks from IndexedDB.
 * @returns {Promise<Array<object>>} A promise that resolves with an array of all tasks.
 */
const getAllTasks = async () => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onerror = (event) => {
            console.error('Erro ao obter todas as tarefas:', event.target.error);
            reject(event.target.error);
        };
    });
};

/**
 * Updates an existing task in IndexedDB.
 * @param {object} task - The updated task object.
 * @returns {Promise<void>} A promise that resolves when the task is updated.
 */
const updateTask = async (task) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(task);

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = (event) => {
            console.error('Erro ao atualizar tarefa:', event.target.error);
            reject(event.target.error);
        };
    });
};

/**
 * Deletes a task from IndexedDB.
 * @param {number} taskId - The ID of the task to delete.
 * @returns {Promise<void>} A promise that resolves when the task is deleted.
 */
const deleteTask = async (taskId) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(taskId);

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = (event) => {
            console.error('Erro ao excluir tarefa:', event.target.error);
            reject(event.target.error);
        };
    });
};


// CalendarGrid Component - CalendarGrid.js
const CalendarGrid = ({ currentDate, selectedDate, tasks, onDaySelect }) => {
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); // 0 for Sunday, 1 for Monday

    const today = new Date();
    const isToday = (year, month, day) => {
        return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
    };

    // Prepare days array with empty slots for padding
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(null); // Empty slots for days before the 1st
    }
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }

    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    // Helper to check if a day has tasks
    const hasTasksForDay = (year, month, day) => {
        return tasks.some(task => {
            // Corrected date comparison: parse string components
            const [taskYear, taskMonth, taskDay] = task.date.split('-').map(Number);
            return taskYear === year && (taskMonth - 1) === month && taskDay === day;
        });
    };

    return (
        <div className="p-4 bg-white shadow-lg rounded-2xl">
            <div className="grid grid-cols-7 gap-2 mb-2 text-center font-bold text-gray-700">
                {weekdays.map(day => (
                    <div key={day}>{day}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
                {days.map((day, index) => {
                    const currentDayFullDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                    const isSelected = selectedDate &&
                        selectedDate.getFullYear() === currentDate.getFullYear() &&
                        selectedDate.getMonth() === currentDate.getMonth() &&
                        selectedDate.getDate() === day;
                    const todayHighlight = isToday(currentDate.getFullYear(), currentDate.getMonth(), day) ? 'border-2 border-blue-500' : '';
                    const hasTasks = day && hasTasksForDay(currentDate.getFullYear(), currentDate.getMonth(), day);

                    return (
                        <div
                            key={index}
                            // Added card-like styles: p-4, rounded-xl, shadow-md, border
                            // Added conditional class for days with tasks: bg-yellow-100 and border-yellow-300
                            className={`p-4 text-center rounded-xl cursor-pointer transition-all duration-200
                                ${day === null ? 'bg-gray-100' : 'bg-gray-50 hover:bg-gray-200 border border-gray-200 shadow-sm'}
                                ${hasTasks && day !== null ? 'bg-yellow-100 border-yellow-300' : ''} {/* New style for days with tasks */}
                                ${isSelected ? 'bg-blue-500 text-white shadow-md border-blue-500' : 'text-gray-800'}
                                ${todayHighlight}
                                relative flex flex-col justify-between items-center h-28 sm:h-32 // Increased height for card appearance
                            `}
                            onClick={() => day !== null && onDaySelect(currentDayFullDate)}
                        >
                            <span className="font-bold text-lg">{day}</span>
                            {hasTasks && day !== null && (
                                <span className="w-3 h-3 bg-purple-500 rounded-full mt-2 block"></span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


// TaskView Component - TaskView.js
const TaskView = ({ selectedDate, tasksForSelectedDay, onAddTask, onDeleteTask, onUpdateTask }) => {
    const [taskText, setTaskText] = useState('');
    const [taskTime, setTaskTime] = useState('');
    const [editingTask, setEditingTask] = useState(null); // Task being edited

    useEffect(() => {
        if (!selectedDate) {
            setTaskText('');
            setTaskTime('');
            setEditingTask(null);
        }
    }, [selectedDate]);

    const handleAddTask = () => {
        if (taskText.trim() === '') return;

        const newTask = {
            date: selectedDate.toISOString().split('T')[0], // Store date as YYYY-MM-DD
            description: taskText.trim(),
            time: taskTime.trim() !== '' ? taskTime.trim() : null,
        };

        if (editingTask) {
            onUpdateTask({ ...editingTask, ...newTask });
            setEditingTask(null);
        } else {
            onAddTask(newTask);
        }

        setTaskText('');
        setTaskTime('');
    };

    const handleEditClick = (task) => {
        setTaskText(task.description);
        setTaskTime(task.time || '');
        setEditingTask(task);
    };

    const sortedTasks = [...tasksForSelectedDay].sort((a, b) => {
        if (!a.time && !b.time) return 0;
        if (!a.time) return 1;
        if (!b.time) return -1;
        return a.time.localeCompare(b.time);
    });

    return (
        <div className="p-6 bg-white shadow-lg rounded-2xl flex flex-col gap-4">
            <h2 className="text-2xl font-semibold text-gray-800">
                Tarefas para {selectedDate ? selectedDate.toLocaleDateString('pt-BR') : 'Selecione um dia'}
            </h2>

            <div className="flex flex-col sm:flex-row gap-3">
                <input
                    type="text"
                    className="flex-grow p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Descrição da tarefa"
                    value={taskText}
                    onChange={(e) => setTaskText(e.target.value)}
                />
                <input
                    type="time"
                    className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={taskTime}
                    onChange={(e) => setTaskTime(e.target.value)}
                />
                <button
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg shadow-md hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105"
                    onClick={handleAddTask}
                >
                    {editingTask ? 'Atualizar Tarefa' : 'Adicionar Tarefa'}
                </button>
            </div>

            {sortedTasks.length === 0 ? (
                <p className="text-gray-600 italic">Nenhuma tarefa para este dia.</p>
            ) : (
                <ul className="space-y-3">
                    {sortedTasks.map((task) => (
                        <li key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg shadow-sm border border-gray-200">
                            <div className="flex-grow">
                                <p className="font-medium text-gray-800">{task.description}</p>
                                {task.time && (
                                    <p className="text-sm text-blue-600 font-semibold mt-1 flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l3 3a1 1 0 001.414-1.414L11 10.586V6z" clipRule="evenodd" />
                                        </svg>
                                        Alerta: {task.time}
                                    </p>
                                )}
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    className="p-2 text-blue-500 hover:text-blue-700 rounded-full hover:bg-blue-100 transition-colors"
                                    onClick={() => handleEditClick(task)}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.38-2.828-2.829z" />
                                    </svg>
                                </button>
                                <button
                                    className="p-2 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100 transition-colors"
                                    onClick={() => onDeleteTask(task.id)}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 11-2 0v6a1 1 0 112 0V8z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

// AllTasksModal Component - AllTasksModal.js
const AllTasksModal = ({ tasksForCurrentMonth, onClose, onDeleteTask, onUpdateTask }) => {
    const [editingTaskInModal, setEditingTaskInModal] = useState(null);
    const [editTaskText, setEditTaskText] = useState('');
    const [editTaskTime, setEditTaskTime] = useState('');

    // Group tasks by date
    const groupedTasks = tasksForCurrentMonth.reduce((acc, task) => {
        const date = task.date; // task.date is already in YYYY-MM-DD format
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(task);
        return acc;
    }, {});

    // Sort dates
    const sortedDates = Object.keys(groupedTasks).sort((a, b) => {
        // Parse dates manually to avoid timezone issues with new Date('YYYY-MM-DD')
        const [yearA, monthA, dayA] = a.split('-').map(Number);
        const [yearB, monthB, dayB] = b.split('-').map(Number);
        const dateObjA = new Date(yearA, monthA - 1, dayA); // month is 0-indexed for Date constructor
        const dateObjB = new Date(yearB, monthB - 1, dayB);
        return dateObjA - dateObjB;
    });

    const handleEditClickInModal = (task) => {
        setEditingTaskInModal(task);
        setEditTaskText(task.description);
        setEditTaskTime(task.time || '');
    };

    const handleUpdateTaskInModal = () => {
        if (!editingTaskInModal || editTaskText.trim() === '') return;

        const updatedTask = {
            ...editingTaskInModal,
            description: editTaskText.trim(),
            time: editTaskTime.trim() !== '' ? editTaskTime.trim() : null,
        };
        onUpdateTask(updatedTask);
        setEditingTaskInModal(null);
        setEditTaskText('');
        setEditTaskTime('');
    };

    const handleCancelEdit = () => {
        setEditingTaskInModal(null);
        setEditTaskText('');
        setEditTaskTime('');
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Tarefas do Mês</h2>

                {sortedDates.length === 0 ? (
                    <p className="text-gray-600 italic text-center">Nenhuma tarefa encontrada para este mês.</p>
                ) : (
                    <div className="space-y-6">
                        {sortedDates.map(date => {
                            // Re-create Date object for display, explicitly in local time to avoid timezone shifts
                            const [year, month, day] = date.split('-').map(Number);
                            const displayDate = new Date(year, month - 1, day); // month is 0-indexed for Date constructor

                            return (
                                <div key={date} className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
                                    <h3 className="text-xl font-semibold text-gray-700 mb-3 border-b pb-2">
                                        {displayDate.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </h3>
                                    <ul className="space-y-2">
                                        {groupedTasks[date].sort((a, b) => { // Sort tasks within each day by time
                                            if (!a.time && !b.time) return 0;
                                            if (!a.time) return 1;
                                            if (!b.time) return -1;
                                            return a.time.localeCompare(b.time);
                                        }).map(task => (
                                            <li key={task.id} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-gray-100">
                                                {editingTaskInModal && editingTaskInModal.id === task.id ? (
                                                    <div className="flex-grow flex flex-col sm:flex-row gap-2">
                                                        <input
                                                            type="text"
                                                            className="flex-grow p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 text-gray-800"
                                                            value={editTaskText}
                                                            onChange={(e) => setEditTaskText(e.target.value)}
                                                        />
                                                        <input
                                                            type="time"
                                                            className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 text-gray-800"
                                                            value={editTaskTime}
                                                            onChange={(e) => setEditTaskTime(e.target.value)}
                                                        />
                                                        <div className="flex space-x-2">
                                                            <button
                                                                className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                                                onClick={handleUpdateTaskInModal}
                                                            >
                                                                Salvar
                                                            </button>
                                                            <button
                                                                className="p-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors"
                                                                onClick={handleCancelEdit}
                                                            >
                                                                Cancelar
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex-grow">
                                                        <p className="font-medium text-gray-800">{task.description}</p>
                                                        {task.time && (
                                                            <p className="text-sm text-blue-600 font-semibold mt-1 flex items-center">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l3 3a1 1 0 001.414-1.414L11 10.586V6z" clipRule="evenodd" />
                                                                </svg>
                                                                Alerta: {task.time}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                                {!editingTaskInModal || editingTaskInModal.id !== task.id ? (
                                                    <div className="flex space-x-2">
                                                        <button
                                                            className="p-2 text-blue-500 hover:text-blue-700 rounded-full hover:bg-blue-100 transition-colors"
                                                            onClick={() => handleEditClickInModal(task)}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.38-2.828-2.829z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            className="p-2 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100 transition-colors"
                                                            onClick={() => onDeleteTask(task.id)}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 11-2 0v6a1 1 0 112 0V8z" clipRule="evenodd" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                ) : null}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};


// Main App Component - App.js
function App() {
    const [currentDate, setCurrentDate] = useState(new Date()); // Date for calendar view
    const [selectedDate, setSelectedDate] = useState(null); // Selected date for task management
    const [allTasks, setAllTasks] = useState([]); // All tasks loaded from IndexedDB
    const [message, setMessage] = useState(''); // For user messages/alerts
    const [showAllTasksModal, setShowAllTasksModal] = useState(false); // State to control modal visibility

    // Function to set a temporary message
    const showMessage = (msg) => {
        setMessage(msg);
        setTimeout(() => setMessage(''), 3000); // Clear message after 3 seconds
    };

    // Load all tasks from IndexedDB on component mount
    useEffect(() => {
        const loadTasks = async () => {
            try {
                const tasks = await getAllTasks();
                setAllTasks(tasks);
            } catch (error) {
                console.error('Falha ao carregar tarefas:', error);
                showMessage('Erro ao carregar tarefas.');
            }
        };
        loadTasks();
    }, []);

    // Filter tasks for the selected day
    const tasksForSelectedDay = selectedDate
        ? allTasks.filter(task => {
            // Corrected date comparison: parse string components
            const [taskYear, taskMonth, taskDay] = task.date.split('-').map(Number);
            return (
                taskYear === selectedDate.getFullYear() &&
                (taskMonth - 1) === selectedDate.getMonth() && // Month is 0-indexed in Date object
                taskDay === selectedDate.getDate()
            );
        })
        : [];

    // Filter tasks for the currently displayed month in the calendar
    const tasksForCurrentMonth = allTasks.filter(task => {
        // Corrected date comparison: parse string components
        const [taskYear, taskMonth] = task.date.split('-').map(Number);
        return (
            taskYear === currentDate.getFullYear() &&
            (taskMonth - 1) === currentDate.getMonth() // Month is 0-indexed in Date object
        );
    });

    // Navigation functions for calendar
    const goToPreviousMonth = () => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate.getFullYear(), prevDate.getMonth() - 1, 1);
            // If the selected date is in the previous month, clear it or move it to the 1st of the new month
            if (selectedDate && selectedDate.getMonth() === prevDate.getMonth()) {
                setSelectedDate(null); // Or set to newDate
            }
            return newDate;
        });
    };

    const goToNextMonth = () => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, 1);
            // If the selected date is in the current month, clear it or move it to the 1st of the new month
            if (selectedDate && selectedDate.getMonth() === prevDate.getMonth()) {
                setSelectedDate(null); // Or set to newDate
            }
            return newDate;
        });
    };

    const handleDaySelect = (date) => {
        setSelectedDate(date);
    };

    const handleAddTask = useCallback(async (newTask) => {
        try {
            const addedTask = await addTask(newTask);
            setAllTasks(prevTasks => [...prevTasks, addedTask]);
            showMessage('Tarefa adicionada com sucesso!');
        } catch (error) {
            console.error('Falha ao adicionar tarefa:', error);
            showMessage('Erro ao adicionar tarefa.');
        }
    }, []);

    const handleUpdateTask = useCallback(async (updatedTask) => {
        try {
            await updateTask(updatedTask);
            setAllTasks(prevTasks =>
                prevTasks.map(task => (task.id === updatedTask.id ? updatedTask : task))
            );
            showMessage('Tarefa atualizada com sucesso!');
        } catch (error) {
            console.error('Falha ao atualizar tarefa:', error);
            showMessage('Erro ao atualizar tarefa.');
        }
    }, []);

    const handleDeleteTask = useCallback(async (taskId) => {
        try {
            await deleteTask(taskId);
            setAllTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
            showMessage('Tarefa excluída com sucesso!');
            // If the last task for the selected day is deleted, clear selectedDate
            if (selectedDate && tasksForSelectedDay.length === 1 && tasksForSelectedDay[0].id === taskId) {
                setSelectedDate(null);
            }
        } catch (error) {
            console.error('Falha ao excluir tarefa:', error);
            showMessage('Erro ao excluir tarefa.');
        }
    }, [selectedDate, tasksForSelectedDay]);


    // Formatar a data atual para exibição
    const currentMonthYear = currentDate.toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric',
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200 p-4 sm:p-8 font-inter">
            <div className="container mx-auto max-w-4xl">
                <h1 className="text-4xl font-extrabold text-center text-gray-800 mb-8 drop-shadow-md">
                    Seu Calendário Pessoal
                </h1>

                {message && (
                    <div className="mb-4 p-3 bg-green-200 text-green-800 rounded-lg text-center font-medium shadow-sm">
                        {message}
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
                    <div className="flex justify-between items-center mb-6">
                        <button
                            className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full shadow-md hover:from-purple-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-110"
                            onClick={goToPreviousMonth}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <h2 className="text-3xl font-bold text-gray-800 capitalize">
                            {currentMonthYear}
                        </h2>
                        <button
                            className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full shadow-md hover:from-purple-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-110"
                            onClick={goToNextMonth}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    <CalendarGrid
                        currentDate={currentDate}
                        selectedDate={selectedDate}
                        tasks={allTasks}
                        onDaySelect={handleDaySelect}
                    />

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => setShowAllTasksModal(true)}
                            className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg shadow-md hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105"
                        >
                            Visualizar Tarefas do Mês
                        </button>
                    </div>
                </div>

                {selectedDate && (
                    <TaskView
                        selectedDate={selectedDate}
                        tasksForSelectedDay={tasksForSelectedDay}
                        onAddTask={handleAddTask}
                        onDeleteTask={handleDeleteTask}
                        onUpdateTask={handleUpdateTask}
                    />
                )}

                {showAllTasksModal && (
                    <AllTasksModal
                        tasksForCurrentMonth={tasksForCurrentMonth} // Pass filtered tasks
                        onClose={() => setShowAllTasksModal(false)}
                        onDeleteTask={handleDeleteTask} // Pass delete handler
                        onUpdateTask={handleUpdateTask} // Pass update handler
                    />
                )}
            </div>
            <style jsx="true" global="true">{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                body {
                    font-family: 'Inter', sans-serif;
                }
            `}</style>
        </div>
    );
}

export default App;
