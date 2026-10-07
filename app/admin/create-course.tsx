import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

/**
 * ============================================================
 * API CONFIGURATION
 * ============================================================
 *
 * If your project already uses an EXPO_PUBLIC_API_URL, it will
 * be used automatically.
 *
 * Otherwise this falls back to localhost.
 *
 * If testing on a physical phone, replace the fallback with
 * your computer's local network IP address, for example:
 *
 * 
 */
const API_URL =
     process.env.EXPO_PUBLIC_API_URL ||
    "https://api.nakkyacademy.co.za/api"; 

/**
 * ============================================================
 * COURSE PRICE
 * ============================================================
 *
 * Course price is fixed at R1,200.
 */
const COURSE_PRICE = 1200;

/**
 * ============================================================
 * TYPES
 * ============================================================
 */

type VideoType =
    | "none"
    | "upload"
    | "external";

type QuestionType =
    | "multiple_choice"
    | "true_false"
    | "short_answer"
    | "long_answer";

interface QuestionDraft {
    id: string;
    type: QuestionType;
    question: string;
    options: string;
    correctAnswer: string;
    marks: string;
}

interface AssignmentDraft {
    enabled: boolean;
    title: string;
    instructions: string;
    passMark: string;
    questions: QuestionDraft[];
}

interface LessonDraft {
    id: string;
    title: string;
    description: string;
    duration: string;

    /**
     * Materials are initially empty.
     *
     * Actual PDF/audio uploads happen after the course
     * receives MongoDB IDs on the Edit Course screen.
     */
    materials: any[];

    video: {
        type: VideoType;
        url: string;
        title: string;
    };
}

interface ModuleDraft {
    id: string;
    title: string;
    description: string;
    lessons: LessonDraft[];
    assignment: AssignmentDraft;
}

interface FinalExamDraft {
    enabled: boolean;
    title: string;
    instructions: string;
    durationMinutes: string;
    passMark: string;
    questions: QuestionDraft[];
}

/**
 * ============================================================
 * ID GENERATOR
 * ============================================================
 *
 * These IDs are only temporary frontend IDs.
 *
 * MongoDB will generate the real IDs after saving.
 */
const createLocalId = () =>
    `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 10)}`;

/**
 * ============================================================
 * EMPTY QUESTION
 * ============================================================
 */
const createQuestion = (): QuestionDraft => ({
    id: createLocalId(),
    type: "multiple_choice",
    question: "",
    options: "",
    correctAnswer: "",
    marks: "1",
});

/**
 * ============================================================
 * EMPTY ASSIGNMENT
 * ============================================================
 */
const createAssignment = (): AssignmentDraft => ({
    enabled: false,
    title: "",
    instructions: "",
    passMark: "80",
    questions: [],
});

/**
 * ============================================================
 * EMPTY LESSON
 * ============================================================
 */
const createLesson = (): LessonDraft => ({
    id: createLocalId(),

    title: "",

    description: "",

    duration: "",

    materials: [],

    video: {
        type: "none",
        url: "",
        title: "",
    },
});

/**
 * ============================================================
 * EMPTY MODULE
 * ============================================================
 */
const createModule = (): ModuleDraft => ({
    id: createLocalId(),

    title: "",

    description: "",

    lessons: [createLesson()],

    assignment: createAssignment(),
});

/**
 * ============================================================
 * EMPTY FINAL EXAM
 * ============================================================
 */
const createFinalExam = (): FinalExamDraft => ({
    enabled: false,

    title: "Final Examination",

    instructions: "",

    durationMinutes: "",

    passMark: "80",

    questions: [],
});


export default function CreateCourseScreen() {
    const router = useRouter();

    /**
     * ========================================================
     * COURSE INFORMATION
     * ========================================================
     */

    const [title, setTitle] =
        useState("");

    const [shortDescription, setShortDescription] =
        useState("");

    const [description, setDescription] =
        useState("");

    const [category, setCategory] =
        useState("");

    const [level, setLevel] =
        useState<
            "Beginner" |
            "Intermediate" |
            "Advanced"
        >("Beginner");

    const [duration, setDuration] =
        useState("");

    const [passMark, setPassMark] =
        useState("80");

    const [published, setPublished] =
        useState(false);

    const [certificate, setCertificate] =
        useState(true);

    /**
     * ========================================================
     * COURSE STRUCTURE
     * ========================================================
     */

    const [modules, setModules] =
        useState<ModuleDraft[]>([
            createModule(),
        ]);

    const [finalExam, setFinalExam] =
        useState<FinalExamDraft>(
            createFinalExam()
        );

    const [saving, setSaving] =
        useState(false);


    /**
     * ========================================================
     * MODULE FUNCTIONS
     * ========================================================
     */

    const addModule = () => {
        setModules((current) => [
            ...current,
            createModule(),
        ]);
    };


    const removeModule = (
        moduleIndex: number
    ) => {
        if (modules.length === 1) {
            Alert.alert(
                "Cannot remove module",
                "A course must contain at least one module."
            );

            return;
        }

        Alert.alert(
            "Remove Module",
            "Are you sure you want to remove this module and all its lessons?",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Remove",
                    style: "destructive",
                    onPress: () => {
                        setModules(
                            (current) =>
                                current.filter(
                                    (_, index) =>
                                        index !==
                                        moduleIndex
                                )
                        );
                    },
                },
            ]
        );
    };


    const updateModule = (
        moduleIndex: number,
        field: "title" | "description",
        value: string
    ) => {
        setModules((current) =>
            current.map(
                (module, index) =>
                    index === moduleIndex
                        ? {
                              ...module,
                              [field]:
                                  value,
                          }
                        : module
            )
        );
    };


    /**
     * ========================================================
     * LESSON FUNCTIONS
     * ========================================================
     */

    const addLesson = (
        moduleIndex: number
    ) => {
        setModules((current) =>
            current.map(
                (module, index) =>
                    index === moduleIndex
                        ? {
                              ...module,
                              lessons: [
                                  ...module.lessons,
                                  createLesson(),
                              ],
                          }
                        : module
            )
        );
    };


    const removeLesson = (
        moduleIndex: number,
        lessonIndex: number
    ) => {
        const module =
            modules[moduleIndex];

        if (
            module.lessons.length === 1
        ) {
            Alert.alert(
                "Cannot remove lesson",
                "Each module must contain at least one lesson."
            );

            return;
        }

        setModules((current) =>
            current.map(
                (moduleItem, index) =>
                    index === moduleIndex
                        ? {
                              ...moduleItem,
                              lessons:
                                  moduleItem.lessons.filter(
                                      (
                                          _,
                                          index
                                      ) =>
                                          index !==
                                          lessonIndex
                                  ),
                          }
                        : moduleItem
            )
        );
    };


    const updateLesson = (
        moduleIndex: number,
        lessonIndex: number,
        field:
            | "title"
            | "description"
            | "duration",
        value: string
    ) => {
        setModules((current) =>
            current.map(
                (module, mIndex) =>
                    mIndex === moduleIndex
                        ? {
                              ...module,
                              lessons:
                                  module.lessons.map(
                                      (
                                          lesson,
                                          lIndex
                                      ) =>
                                          lIndex ===
                                          lessonIndex
                                              ? {
                                                    ...lesson,
                                                    [field]:
                                                        value,
                                                }
                                              : lesson
                                  ),
                          }
                        : module
            )
        );
    };


    /**
     * ========================================================
     * VIDEO FUNCTIONS
     * ========================================================
     */

    const setVideoType = (
        moduleIndex: number,
        lessonIndex: number,
        type: VideoType
    ) => {
        setModules((current) =>
            current.map(
                (module, mIndex) =>
                    mIndex === moduleIndex
                        ? {
                              ...module,
                              lessons:
                                  module.lessons.map(
                                      (
                                          lesson,
                                          lIndex
                                      ) =>
                                          lIndex ===
                                          lessonIndex
                                              ? {
                                                    ...lesson,
                                                    video: {
                                                        ...lesson.video,
                                                        type,
                                                        url:
                                                            type ===
                                                            "external"
                                                                ? lesson
                                                                      .video
                                                                      .url
                                                                : "",
                                                    },
                                                }
                                              : lesson
                                  ),
                          }
                        : module
            )
        );
    };


    const updateExternalVideoUrl = (
        moduleIndex: number,
        lessonIndex: number,
        value: string
    ) => {
        setModules((current) =>
            current.map(
                (module, mIndex) =>
                    mIndex === moduleIndex
                        ? {
                              ...module,
                              lessons:
                                  module.lessons.map(
                                      (
                                          lesson,
                                          lIndex
                                      ) =>
                                          lIndex ===
                                          lessonIndex
                                              ? {
                                                    ...lesson,
                                                    video: {
                                                        ...lesson.video,
                                                        type: "external",
                                                        url: value,
                                                    },
                                                }
                                              : lesson
                                  ),
                          }
                        : module
            )
        );
    };


    /**
     * ========================================================
     * ASSIGNMENT FUNCTIONS
     * ========================================================
     */

    const toggleAssignment = (
        moduleIndex: number
    ) => {
        setModules((current) =>
            current.map(
                (module, index) =>
                    index === moduleIndex
                        ? {
                              ...module,
                              assignment: {
                                  ...module.assignment,
                                  enabled:
                                      !module
                                          .assignment
                                          .enabled,
                              },
                          }
                        : module
            )
        );
    };


    const updateAssignment = (
        moduleIndex: number,
        field:
            | "title"
            | "instructions"
            | "passMark",
        value: string
    ) => {
        setModules((current) =>
            current.map(
                (module, index) =>
                    index === moduleIndex
                        ? {
                              ...module,
                              assignment: {
                                  ...module.assignment,
                                  [field]:
                                      value,
                              },
                          }
                        : module
            )
        );
    };


    const addAssignmentQuestion = (
        moduleIndex: number
    ) => {
        setModules((current) =>
            current.map(
                (module, index) =>
                    index === moduleIndex
                        ? {
                              ...module,
                              assignment: {
                                  ...module.assignment,
                                  questions: [
                                      ...module
                                          .assignment
                                          .questions,
                                      createQuestion(),
                                  ],
                              },
                          }
                        : module
            )
        );
    };


    const removeAssignmentQuestion = (
        moduleIndex: number,
        questionIndex: number
    ) => {
        setModules((current) =>
            current.map(
                (module, index) =>
                    index === moduleIndex
                        ? {
                              ...module,
                              assignment: {
                                  ...module.assignment,
                                  questions:
                                      module.assignment.questions.filter(
                                          (
                                              _,
                                              index
                                          ) =>
                                              index !==
                                              questionIndex
                                      ),
                              },
                          }
                        : module
            )
        );
    };


    const updateAssignmentQuestion = (
        moduleIndex: number,
        questionIndex: number,
        field:
            | "question"
            | "options"
            | "correctAnswer"
            | "marks"
            | "type",
        value: string
    ) => {
        setModules((current) =>
            current.map(
                (module, mIndex) =>
                    mIndex === moduleIndex
                        ? {
                              ...module,
                              assignment: {
                                  ...module.assignment,
                                  questions:
                                      module.assignment.questions.map(
                                          (
                                              question,
                                              qIndex
                                          ) =>
                                              qIndex ===
                                              questionIndex
                                                  ? {
                                                        ...question,
                                                        [field]:
                                                            value,
                                                    }
                                                  : question
                                      ),
                              },
                          }
                        : module
            )
        );
    };


    /**
     * ========================================================
     * FINAL EXAM FUNCTIONS
     * ========================================================
     */

    const updateFinalExam = (
        field:
            | "title"
            | "instructions"
            | "durationMinutes"
            | "passMark",
        value: string
    ) => {
        setFinalExam(
            (current) => ({
                ...current,
                [field]: value,
            })
        );
    };


    const toggleFinalExam = () => {
        setFinalExam(
            (current) => ({
                ...current,
                enabled:
                    !current.enabled,
            })
        );
    };


    const addFinalExamQuestion =
        () => {
            setFinalExam(
                (current) => ({
                    ...current,
                    questions: [
                        ...current.questions,
                        createQuestion(),
                    ],
                })
            );
        };


    const removeFinalExamQuestion = (
        questionIndex: number
    ) => {
        setFinalExam(
            (current) => ({
                ...current,
                questions:
                    current.questions.filter(
                        (_, index) =>
                            index !==
                            questionIndex
                    ),
            })
        );
    };


    const updateFinalExamQuestion = (
        questionIndex: number,
        field:
            | "question"
            | "options"
            | "correctAnswer"
            | "marks"
            | "type",
        value: string
    ) => {
        setFinalExam(
            (current) => ({
                ...current,
                questions:
                    current.questions.map(
                        (
                            question,
                            index
                        ) =>
                            index ===
                            questionIndex
                                ? {
                                      ...question,
                                      [field]:
                                          value,
                                  }
                                : question
                    ),
            })
        );
    };


    /**
     * ========================================================
     * VALIDATION
     * ========================================================
     */

    const validateCourse = () => {
        if (!title.trim()) {
            Alert.alert(
                "Missing Course Title",
                "Please enter the course title."
            );
            return false;
        }

        if (!description.trim()) {
            Alert.alert(
                "Missing Description",
                "Please enter the course description."
            );
            return false;
        }

        if (modules.length === 0) {
            Alert.alert(
                "No Modules",
                "Please add at least one module."
            );
            return false;
        }

        for (
            let moduleIndex = 0;
            moduleIndex <
            modules.length;
            moduleIndex++
        ) {
            const module =
                modules[moduleIndex];

            if (!module.title.trim()) {
                Alert.alert(
                    "Missing Module Title",
                    `Please enter a title for Module ${
                        moduleIndex + 1
                    }.`
                );
                return false;
            }

            if (
                module.lessons.length === 0
            ) {
                Alert.alert(
                    "No Lessons",
                    `Module ${
                        moduleIndex + 1
                    } must contain at least one lesson.`
                );
                return false;
            }

            for (
                let lessonIndex = 0;
                lessonIndex <
                module.lessons.length;
                lessonIndex++
            ) {
                const lesson =
                    module.lessons[
                        lessonIndex
                    ];

                if (!lesson.title.trim()) {
                    Alert.alert(
                        "Missing Lesson Title",
                        `Please enter a title for Module ${
                            moduleIndex + 1
                        }, Lesson ${
                            lessonIndex + 1
                        }.`
                    );
                    return false;
                }

                if (
                    lesson.video.type ===
                    "external"
                ) {
                    const url =
                        lesson.video.url.trim();

                    if (
                        url &&
                        !/^https?:\/\//i.test(
                            url
                        )
                    ) {
                        Alert.alert(
                            "Invalid Video URL",
                            `The external video URL for Module ${
                                moduleIndex + 1
                            }, Lesson ${
                                lessonIndex + 1
                            } must begin with http:// or https://.`
                        );

                        return false;
                    }
                }
            }

            if (
                module.assignment.enabled
            ) {
                if (
                    !module.assignment.title.trim()
                ) {
                    Alert.alert(
                        "Assignment Title Missing",
                        `Please enter an assignment title for Module ${
                            moduleIndex + 1
                        }.`
                    );

                    return false;
                }

                for (
                    const question of module
                        .assignment
                        .questions
                ) {
                    if (
                        !question.question.trim()
                    ) {
                        Alert.alert(
                            "Assignment Question Missing",
                            `Please complete all assignment questions in Module ${
                                moduleIndex + 1
                            }.`
                        );

                        return false;
                    }
                }
            }
        }

        if (finalExam.enabled) {
            if (
                !finalExam.title.trim()
            ) {
                Alert.alert(
                    "Final Examination Title Missing",
                    "Please enter a title for the final examination."
                );

                return false;
            }

            for (
                const question of finalExam.questions
            ) {
                if (
                    !question.question.trim()
                ) {
                    Alert.alert(
                        "Final Examination Question Missing",
                        "Please complete all final examination questions."
                    );

                    return false;
                }
            }
        }

        const numericPassMark =
            Number(passMark);

        if (
            Number.isNaN(
                numericPassMark
            ) ||
            numericPassMark < 0 ||
            numericPassMark > 100
        ) {
            Alert.alert(
                "Invalid Pass Mark",
                "Pass mark must be between 0 and 100."
            );

            return false;
        }

        return true;
    };


    /**
     * ========================================================
     * PREPARE PAYLOAD
     * ========================================================
     */

    const buildPayload = () => {
        return {
            title: title.trim(),

            shortDescription:
                shortDescription.trim(),

            description:
                description.trim(),

            category:
                category.trim() ||
                "General",

            level,

            duration:
                Number(duration) || 0,

            /**
             * Price is deliberately fixed.
             */
            price: COURSE_PRICE,

            published,

            certificate,

            passMark:
                Number(passMark) || 80,

            modules: modules.map(
                (
                    module,
                    moduleIndex
                ) => ({
                    title:
                        module.title.trim(),

                    description:
                        module.description.trim(),

                    order:
                        moduleIndex + 1,

                    lessons:
                        module.lessons.map(
                            (
                                lesson,
                                lessonIndex
                            ) => ({
                                title:
                                    lesson.title.trim(),

                                description:
                                    lesson.description.trim(),

                                duration:
                                    Number(
                                        lesson.duration
                                    ) || 0,

                                order:
                                    lessonIndex +
                                    1,

                                /**
                                 * No actual file has been
                                 * uploaded at this stage.
                                 */
                                materials: [],

                                video: {
                                    type:
                                        lesson.video
                                            .type,

                                    url:
                                        lesson.video
                                            .type ===
                                        "external"
                                            ? lesson.video.url.trim()
                                            : "",

                                    filename:
                                        "",

                                    title:
                                        lesson.video
                                            .title ||
                                        "",
                                },
                            })
                        ),

                    assignment: {
                        enabled:
                            module.assignment
                                .enabled,

                        title:
                            module.assignment.title.trim(),

                        instructions:
                            module.assignment.instructions.trim(),

                        passMark:
                            Number(
                                module.assignment
                                    .passMark
                            ) || 80,

                        questions:
                            module.assignment.questions.map(
                                (
                                    question,
                                    questionIndex
                                ) => ({
                                    type:
                                        question.type,

                                    question:
                                        question.question.trim(),

                                    options:
                                        question.options
                                            .split(",")
                                            .map(
                                                (
                                                    option
                                                ) =>
                                                    option.trim()
                                            )
                                            .filter(
                                                Boolean
                                            ),

                                    correctAnswer:
                                        question.correctAnswer.trim(),

                                    marks:
                                        Number(
                                            question.marks
                                        ) || 1,

                                    order:
                                        questionIndex +
                                        1,
                                })
                            ),
                    },
                })
            ),

            finalExam: {
                enabled:
                    finalExam.enabled,

                title:
                    finalExam.title.trim(),

                instructions:
                    finalExam.instructions.trim(),

                durationMinutes:
                    Number(
                        finalExam.durationMinutes
                    ) || 0,

                passMark:
                    Number(
                        finalExam.passMark
                    ) || 80,

                questions:
                    finalExam.questions.map(
                        (
                            question,
                            questionIndex
                        ) => ({
                            type:
                                question.type,

                            question:
                                question.question.trim(),

                            options:
                                question.options
                                    .split(",")
                                    .map(
                                        (
                                            option
                                        ) =>
                                            option.trim()
                                    )
                                    .filter(
                                        Boolean
                                    ),

                            correctAnswer:
                                question.correctAnswer.trim(),

                            marks:
                                Number(
                                    question.marks
                                ) || 1,

                            order:
                                questionIndex +
                                1,
                        })
                    ),
            },
        };
    };


    /**
     * ========================================================
     * CREATE COURSE
     * ========================================================
     */

    const handleCreateCourse =
        async () => {
            if (!validateCourse()) {
                return;
            }

            try {
                setSaving(true);

                const token =
                    await AsyncStorage.getItem(
                        "token"
                    );

                if (!token) {
                    Alert.alert(
                        "Authentication Required",
                        "Your admin session has expired. Please log in again."
                    );

                    return;
                }

                const payload =
                    buildPayload();

                const response =
                    await fetch(
                        `${API_URL}/courses`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                Authorization:
                                    `Bearer ${token}`,
                            },

                            body: JSON.stringify(
                                payload
                            ),
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                            "Failed to create course."
                    );
                }

                const createdCourse =
                    data.course;

                if (
                    !createdCourse?._id
                ) {
                    throw new Error(
                        "Course was created but the server did not return a course ID."
                    );
                }

                Alert.alert(
                    "Course Created",
                    "The course structure has been created. You can now upload PDFs, audio recordings and videos to the individual lessons.",
                    [
                        {
                            text: "Continue",
                            onPress: () => {
                                router.replace({
                                    pathname:
                                        "/admin/edit-course",
                                    params: {
                                        id:
                                            createdCourse._id,
                                    },
                                });
                            },
                        },
                    ]
                );
            } catch (error: any) {
                console.error(
                    "Create course error:",
                    error
                );

                Alert.alert(
                    "Create Course Failed",
                    error?.message ||
                        "Something went wrong while creating the course."
                );
            } finally {
                setSaving(false);
            }
        };


    /**
     * ========================================================
     * RENDER QUESTION
     * ========================================================
     */

    const renderQuestion = (
        question: QuestionDraft,
        questionIndex: number,
        updateQuestion: (
            field:
                | "question"
                | "options"
                | "correctAnswer"
                | "marks"
                | "type",
            value: string
        ) => void,
        removeQuestion: () => void
    ) => {
        return (
            <View
                key={question.id}
                style={styles.questionCard}
            >
                <View
                    style={
                        styles.questionHeader
                    }
                >
                    <Text
                        style={
                            styles.questionNumber
                        }
                    >
                        Question{" "}
                        {questionIndex +
                            1}
                    </Text>

                    <TouchableOpacity
                        onPress={
                            removeQuestion
                        }
                    >
                        <Text
                            style={
                                styles.removeText
                            }
                        >
                            Remove
                        </Text>
                    </TouchableOpacity>
                </View>

                <Text
                    style={styles.label}
                >
                    Question
                </Text>

                <TextInput
                    style={
                        styles.textAreaSmall
                    }
                    value={
                        question.question
                    }
                    onChangeText={(
                        value
                    ) =>
                        updateQuestion(
                            "question",
                            value
                        )
                    }
                    placeholder="Enter the question..."
                    multiline
                />

                <Text
                    style={styles.label}
                >
                    Question Type
                </Text>

                <View
                    style={
                        styles.choiceRow
                    }
                >
                    {(
                        [
                            [
                                "multiple_choice",
                                "Multiple Choice",
                            ],
                            [
                                "true_false",
                                "True / False",
                            ],
                            [
                                "short_answer",
                                "Short Answer",
                            ],
                            [
                                "long_answer",
                                "Long Answer",
                            ],
                        ] as [
                            QuestionType,
                            string
                        ][]
                    ).map(
                        ([
                            type,
                            label,
                        ]) => (
                            <TouchableOpacity
                                key={
                                    type
                                }
                                style={[
                                    styles.choiceButton,
                                    question.type ===
                                        type &&
                                        styles.choiceButtonActive,
                                ]}
                                onPress={() =>
                                    updateQuestion(
                                        "type",
                                        type
                                    )
                                }
                            >
                                <Text
                                    style={[
                                        styles.choiceText,
                                        question.type ===
                                            type &&
                                            styles.choiceTextActive,
                                    ]}
                                >
                                    {
                                        label
                                    }
                                </Text>
                            </TouchableOpacity>
                        )
                    )}
                </View>

                {(question.type ===
                    "multiple_choice" ||
                    question.type ===
                        "true_false") && (
                    <>
                        <Text
                            style={
                                styles.label
                            }
                        >
                            Options
                        </Text>

                        <TextInput
                            style={
                                styles.input
                            }
                            value={
                                question.options
                            }
                            onChangeText={(
                                value
                            ) =>
                                updateQuestion(
                                    "options",
                                    value
                                )
                            }
                            placeholder="Example: Option A, Option B, Option C"
                        />

                        <Text
                            style={
                                styles.helperText
                            }
                        >
                            Separate options with
                            commas.
                        </Text>

                        <Text
                            style={
                                styles.label
                            }
                        >
                            Correct Answer
                        </Text>

                        <TextInput
                            style={
                                styles.input
                            }
                            value={
                                question.correctAnswer
                            }
                            onChangeText={(
                                value
                            ) =>
                                updateQuestion(
                                    "correctAnswer",
                                    value
                                )
                            }
                            placeholder="Enter the correct answer"
                        />
                    </>
                )}

                <Text
                    style={styles.label}
                >
                    Marks
                </Text>

                <TextInput
                    style={
                        styles.smallInput
                    }
                    value={
                        question.marks
                    }
                    onChangeText={(
                        value
                    ) =>
                        updateQuestion(
                            "marks",
                            value
                        )
                    }
                    keyboardType="numeric"
                    placeholder="1"
                />
            </View>
        );
    };


    /**
     * ========================================================
     * MAIN UI
     * ========================================================
     */

    return (
        <View
            style={
                styles.container
            }
        >
            <ScrollView
                contentContainerStyle={
                    styles.content
                }
                showsVerticalScrollIndicator={
                    false
                }
            >
                {/* =================================================
                    HEADER
                ================================================== */}

                <View
                    style={
                        styles.header
                    }
                >
                    <Text
                        style={
                            styles.headerTitle
                        }
                    >
                        Create Course
                    </Text>

                    <Text
                        style={
                            styles.headerSubtitle
                        }
                    >
                        Build the complete
                        course structure before
                        uploading your course
                        materials.
                    </Text>
                </View>


                {/* =================================================
                    COURSE DETAILS
                ================================================== */}

                <View
                    style={
                        styles.section
                    }
                >
                    <Text
                        style={
                            styles.sectionTitle
                        }
                    >
                        Course Details
                    </Text>

                    <Text
                        style={styles.label}
                    >
                        Course Title *
                    </Text>

                    <TextInput
                        style={styles.input}
                        value={title}
                        onChangeText={
                            setTitle
                        }
                        placeholder="Example: Professional Childcare & Nanny Course"
                    />

                    <Text
                        style={styles.label}
                    >
                        Short Description
                    </Text>

                    <TextInput
                        style={styles.input}
                        value={
                            shortDescription
                        }
                        onChangeText={
                            setShortDescription
                        }
                        placeholder="Short summary of the course"
                    />

                    <Text
                        style={styles.label}
                    >
                        Full Description *
                    </Text>

                    <TextInput
                        style={
                            styles.textArea
                        }
                        value={
                            description
                        }
                        onChangeText={
                            setDescription
                        }
                        placeholder="Describe the course in detail..."
                        multiline
                        textAlignVertical="top"
                    />

                    <Text
                        style={styles.label}
                    >
                        Category
                    </Text>

                    <TextInput
                        style={styles.input}
                        value={
                            category
                        }
                        onChangeText={
                            setCategory
                        }
                        placeholder="Example: Childcare"
                    />

                    <Text
                        style={styles.label}
                    >
                        Level
                    </Text>

                    <View
                        style={
                            styles.choiceRow
                        }
                    >
                        {(
                            [
                                "Beginner",
                                "Intermediate",
                                "Advanced",
                            ] as const
                        ).map(
                            (item) => (
                                <TouchableOpacity
                                    key={
                                        item
                                    }
                                    style={[
                                        styles.choiceButton,
                                        level ===
                                            item &&
                                            styles.choiceButtonActive,
                                    ]}
                                    onPress={() =>
                                        setLevel(
                                            item
                                        )
                                    }
                                >
                                    <Text
                                        style={[
                                            styles.choiceText,
                                            level ===
                                                item &&
                                                styles.choiceTextActive,
                                        ]}
                                    >
                                        {
                                            item
                                        }
                                    </Text>
                                </TouchableOpacity>
                            )
                        )}
                    </View>

                    <Text
                        style={styles.label}
                    >
                        Duration
                    </Text>

                    <TextInput
                        style={styles.input}
                        value={
                            duration
                        }
                        onChangeText={
                            setDuration
                        }
                        placeholder="Duration in hours"
                        keyboardType="numeric"
                    />

                    <Text
                        style={styles.label}
                    >
                        Course Price
                    </Text>

                    <View
                        style={
                            styles.priceBox
                        }
                    >
                        <Text
                            style={
                                styles.priceText
                            }
                        >
                            R
                            {COURSE_PRICE.toLocaleString(
                                "en-ZA"
                            )}
                        </Text>

                        <Text
                            style={
                                styles.priceNote
                            }
                        >
                            Fixed course price
                        </Text>
                    </View>

                    <Text
                        style={styles.label}
                    >
                        Course Pass Mark
                    </Text>

                    <TextInput
                        style={
                            styles.smallInput
                        }
                        value={
                            passMark
                        }
                        onChangeText={
                            setPassMark
                        }
                        keyboardType="numeric"
                        placeholder="80"
                    />

                    <View
                        style={
                            styles.switchRow
                        }
                    >
                        <View>
                            <Text
                                style={
                                    styles.switchTitle
                                }
                            >
                                Published
                            </Text>

                            <Text
                                style={
                                    styles.switchDescription
                                }
                            >
                                Make this course
                                visible to
                                students.
                            </Text>
                        </View>

                        <Switch
                            value={
                                published
                            }
                            onValueChange={
                                setPublished
                            }
                        />
                    </View>

                    <View
                        style={
                            styles.switchRow
                        }
                    >
                        <View>
                            <Text
                                style={
                                    styles.switchTitle
                                }
                            >
                                Certificate
                            </Text>

                            <Text
                                style={
                                    styles.switchDescription
                                }
                            >
                                Issue a certificate
                                when students
                                complete the
                                course.
                            </Text>
                        </View>

                        <Switch
                            value={
                                certificate
                            }
                            onValueChange={
                                setCertificate
                            }
                        />
                    </View>
                </View>


                {/* =================================================
                    COURSE STRUCTURE
                ================================================== */}

                <View
                    style={
                        styles.structureHeader
                    }
                >
                    <View
                        style={
                            styles.structureHeaderText
                        }
                    >
                        <Text
                            style={
                                styles.sectionTitle
                            }
                        >
                            Course Structure
                        </Text>

                        <Text
                            style={
                                styles.structureDescription
                            }
                        >
                            Organise your course
                            into modules,
                            lessons, materials
                            and assessments.
                        </Text>
                    </View>

                    <View
                        style={
                            styles.moduleCountBadge
                        }
                    >
                        <Text
                            style={
                                styles.moduleCountText
                            }
                        >
                            {modules.length}{" "}
                            {modules.length ===
                            1
                                ? "Module"
                                : "Modules"}
                        </Text>
                    </View>
                </View>


                {/* =================================================
                    MODULES
                ================================================== */}

                {modules.map(
                    (
                        module,
                        moduleIndex
                    ) => (
                        <View
                            key={
                                module.id
                            }
                            style={
                                styles.moduleCard
                            }
                        >
                            <View
                                style={
                                    styles.moduleHeader
                                }
                            >
                                <View
                                    style={
                                        styles.moduleTitleContainer
                                    }
                                >
                                    <View
                                        style={
                                            styles.moduleNumber
                                        }
                                    >
                                        <Text
                                            style={
                                                styles.moduleNumberText
                                            }
                                        >
                                            {moduleIndex +
                                                1}
                                        </Text>
                                    </View>

                                    <View>
                                        <Text
                                            style={
                                                styles.moduleLabel
                                            }
                                        >
                                            MODULE{" "}
                                            {moduleIndex +
                                                1}
                                        </Text>

                                        <Text
                                            style={
                                                styles.moduleHint
                                            }
                                        >
                                            Add
                                            lessons
                                            and
                                            resources
                                            to this
                                            module.
                                        </Text>
                                    </View>
                                </View>

                                {modules.length >
                                    1 && (
                                    <TouchableOpacity
                                        onPress={() =>
                                            removeModule(
                                                moduleIndex
                                            )
                                        }
                                    >
                                        <Text
                                            style={
                                                styles.removeText
                                            }
                                        >
                                            Remove
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            <Text
                                style={
                                    styles.label
                                }
                            >
                                Module Title *
                            </Text>

                            <TextInput
                                style={
                                    styles.input
                                }
                                value={
                                    module.title
                                }
                                onChangeText={(
                                    value
                                ) =>
                                    updateModule(
                                        moduleIndex,
                                        "title",
                                        value
                                    )
                                }
                                placeholder="Example: Child Development"
                            />

                            <Text
                                style={
                                    styles.label
                                }
                            >
                                Module Description
                            </Text>

                            <TextInput
                                style={
                                    styles.textAreaSmall
                                }
                                value={
                                    module.description
                                }
                                onChangeText={(
                                    value
                                ) =>
                                    updateModule(
                                        moduleIndex,
                                        "description",
                                        value
                                    )
                                }
                                placeholder="Describe this module..."
                                multiline
                                textAlignVertical="top"
                            />


                            {/* =========================================
                                LESSONS
                            ========================================== */}

                            <View
                                style={
                                    styles.subsectionHeader
                                }
                            >
                                <Text
                                    style={
                                        styles.subsectionTitle
                                    }
                                >
                                    Lessons
                                </Text>

                                <Text
                                    style={
                                        styles.countText
                                    }
                                >
                                    {
                                        module
                                            .lessons
                                            .length
                                    }{" "}
                                    {module
                                        .lessons
                                        .length ===
                                    1
                                        ? "Lesson"
                                        : "Lessons"}
                                </Text>
                            </View>

                            {module.lessons.map(
                                (
                                    lesson,
                                    lessonIndex
                                ) => (
                                    <View
                                        key={
                                            lesson.id
                                        }
                                        style={
                                            styles.lessonCard
                                        }
                                    >
                                        <View
                                            style={
                                                styles.lessonHeader
                                            }
                                        >
                                            <Text
                                                style={
                                                    styles.lessonTitle
                                                }
                                            >
                                                Lesson{" "}
                                                {lessonIndex +
                                                    1}
                                            </Text>

                                            {module
                                                .lessons
                                                .length >
                                                1 && (
                                                <TouchableOpacity
                                                    onPress={() =>
                                                        removeLesson(
                                                            moduleIndex,
                                                            lessonIndex
                                                        )
                                                    }
                                                >
                                                    <Text
                                                        style={
                                                            styles.removeText
                                                        }
                                                    >
                                                        Remove
                                                    </Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>

                                        <Text
                                            style={
                                                styles.label
                                            }
                                        >
                                            Lesson Title *
                                        </Text>

                                        <TextInput
                                            style={
                                                styles.input
                                            }
                                            value={
                                                lesson.title
                                            }
                                            onChangeText={(
                                                value
                                            ) =>
                                                updateLesson(
                                                    moduleIndex,
                                                    lessonIndex,
                                                    "title",
                                                    value
                                                )
                                            }
                                            placeholder="Example: Understanding Child Development"
                                        />

                                        <Text
                                            style={
                                                styles.label
                                            }
                                        >
                                            Lesson Description
                                        </Text>

                                        <TextInput
                                            style={
                                                styles.textAreaSmall
                                            }
                                            value={
                                                lesson.description
                                            }
                                            onChangeText={(
                                                value
                                            ) =>
                                                updateLesson(
                                                    moduleIndex,
                                                    lessonIndex,
                                                    "description",
                                                    value
                                                )
                                            }
                                            placeholder="Describe this lesson..."
                                            multiline
                                            textAlignVertical="top"
                                        />

                                        <Text
                                            style={
                                                styles.label
                                            }
                                        >
                                            Duration
                                        </Text>

                                        <TextInput
                                            style={
                                                styles.smallInput
                                            }
                                            value={
                                                lesson.duration
                                            }
                                            onChangeText={(
                                                value
                                            ) =>
                                                updateLesson(
                                                    moduleIndex,
                                                    lessonIndex,
                                                    "duration",
                                                    value
                                                )
                                            }
                                            placeholder="Minutes"
                                            keyboardType="numeric"
                                        />


                                        {/* =================================
                                            MATERIALS
                                        ================================== */}

                                        <View
                                            style={
                                                styles.materialSection
                                            }
                                        >
                                            <Text
                                                style={
                                                    styles.materialTitle
                                                }
                                            >
                                                Lesson Materials
                                            </Text>

                                            <Text
                                                style={
                                                    styles.materialDescription
                                                }
                                            >
                                                This lesson
                                                can contain
                                                multiple
                                                PDFs and
                                                audio
                                                recordings.
                                            </Text>

                                            <View
                                                style={
                                                    styles.materialPreview
                                                }
                                            >
                                                <View
                                                    style={
                                                        styles.materialIcon
                                                    }
                                                >
                                                    <Text
                                                        style={
                                                            styles.materialIconText
                                                        }
                                                    >
                                                        📄
                                                    </Text>
                                                </View>

                                                <View
                                                    style={
                                                        styles.materialPreviewText
                                                    }
                                                >
                                                    <Text
                                                        style={
                                                            styles.materialPreviewTitle
                                                        }
                                                    >
                                                        PDF
                                                        Documents
                                                    </Text>

                                                    <Text
                                                        style={
                                                            styles.materialPreviewDescription
                                                        }
                                                    >
                                                        Upload
                                                        your
                                                        PDFs
                                                        after
                                                        saving
                                                        the
                                                        course.
                                                    </Text>
                                                </View>
                                            </View>

                                            <View
                                                style={
                                                    styles.materialPreview
                                                }
                                            >
                                                <View
                                                    style={
                                                        styles.materialIcon
                                                    }
                                                >
                                                    <Text
                                                        style={
                                                            styles.materialIconText
                                                        }
                                                    >
                                                        🎧
                                                    </Text>
                                                </View>

                                                <View
                                                    style={
                                                        styles.materialPreviewText
                                                    }
                                                >
                                                    <Text
                                                        style={
                                                            styles.materialPreviewTitle
                                                        }
                                                    >
                                                        Audio
                                                        Recordings
                                                    </Text>

                                                    <Text
                                                        style={
                                                            styles.materialPreviewDescription
                                                        }
                                                    >
                                                        Upload
                                                        multiple
                                                        audio
                                                        recordings
                                                        after
                                                        saving
                                                        the
                                                        course.
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>


                                        {/* =================================
                                            VIDEO
                                        ================================== */}

                                        <View
                                            style={
                                                styles.materialSection
                                            }
                                        >
                                            <Text
                                                style={
                                                    styles.materialTitle
                                                }
                                            >
                                                Lesson Video
                                            </Text>

                                            <Text
                                                style={
                                                    styles.materialDescription
                                                }
                                            >
                                                Choose an
                                                uploaded
                                                video or
                                                external
                                                video link.
                                            </Text>

                                            <View
                                                style={
                                                    styles.choiceRow
                                                }
                                            >
                                                <TouchableOpacity
                                                    style={[
                                                        styles.choiceButton,
                                                        lesson
                                                            .video
                                                            .type ===
                                                            "none" &&
                                                            styles.choiceButtonActive,
                                                    ]}
                                                    onPress={() =>
                                                        setVideoType(
                                                            moduleIndex,
                                                            lessonIndex,
                                                            "none"
                                                        )
                                                    }
                                                >
                                                    <Text
                                                        style={[
                                                            styles.choiceText,
                                                            lesson
                                                                .video
                                                                .type ===
                                                                "none" &&
                                                                styles.choiceTextActive,
                                                        ]}
                                                    >
                                                        No
                                                        Video
                                                    </Text>
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    style={[
                                                        styles.choiceButton,
                                                        lesson
                                                            .video
                                                            .type ===
                                                            "upload" &&
                                                            styles.choiceButtonActive,
                                                    ]}
                                                    onPress={() =>
                                                        setVideoType(
                                                            moduleIndex,
                                                            lessonIndex,
                                                            "upload"
                                                        )
                                                    }
                                                >
                                                    <Text
                                                        style={[
                                                            styles.choiceText,
                                                            lesson
                                                                .video
                                                                .type ===
                                                                "upload" &&
                                                                styles.choiceTextActive,
                                                        ]}
                                                    >
                                                        Upload
                                                        Video
                                                    </Text>
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    style={[
                                                        styles.choiceButton,
                                                        lesson
                                                            .video
                                                            .type ===
                                                            "external" &&
                                                            styles.choiceButtonActive,
                                                    ]}
                                                    onPress={() =>
                                                        setVideoType(
                                                            moduleIndex,
                                                            lessonIndex,
                                                            "external"
                                                        )
                                                    }
                                                >
                                                    <Text
                                                        style={[
                                                            styles.choiceText,
                                                            lesson
                                                                .video
                                                                .type ===
                                                                "external" &&
                                                                styles.choiceTextActive,
                                                        ]}
                                                    >
                                                        External
                                                        Link
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>

                                            {lesson
                                                .video
                                                .type ===
                                                "upload" && (
                                                <View
                                                    style={
                                                        styles.uploadNotice
                                                    }
                                                >
                                                    <Text
                                                        style={
                                                            styles.uploadNoticeTitle
                                                        }
                                                    >
                                                        🎥 Video
                                                        upload
                                                    </Text>

                                                    <Text
                                                        style={
                                                            styles.uploadNoticeText
                                                        }
                                                    >
                                                        Save
                                                        the
                                                        course
                                                        first.
                                                        The
                                                        Edit
                                                        Course
                                                        screen
                                                        will
                                                        provide
                                                        the
                                                        Upload
                                                        Video
                                                        button
                                                        for
                                                        this
                                                        lesson.
                                                    </Text>
                                                </View>
                                            )}

                                            {lesson
                                                .video
                                                .type ===
                                                "external" && (
                                                <>
                                                    <Text
                                                        style={
                                                            styles.label
                                                        }
                                                    >
                                                        External
                                                        Video
                                                        URL
                                                    </Text>

                                                    <TextInput
                                                        style={
                                                            styles.input
                                                        }
                                                        value={
                                                            lesson
                                                                .video
                                                                .url
                                                        }
                                                        onChangeText={(
                                                            value
                                                        ) =>
                                                            updateExternalVideoUrl(
                                                                moduleIndex,
                                                                lessonIndex,
                                                                value
                                                            )
                                                        }
                                                        placeholder="https://www.youtube.com/..."
                                                        autoCapitalize="none"
                                                        keyboardType="url"
                                                    />
                                                </>
                                            )}
                                        </View>
                                    </View>
                                )
                            )}

                            <TouchableOpacity
                                style={
                                    styles.addLessonButton
                                }
                                onPress={() =>
                                    addLesson(
                                        moduleIndex
                                    )
                                }
                            >
                                <Text
                                    style={
                                        styles.addLessonButtonText
                                    }
                                >
                                    + Add Lesson
                                </Text>
                            </TouchableOpacity>


                            {/* =========================================
                                MODULE ASSIGNMENT
                            ========================================== */}

                            <View
                                style={
                                    styles.assignmentSection
                                }
                            >
                                <View
                                    style={
                                        styles.switchRow
                                    }
                                >
                                    <View
                                        style={
                                            styles.assignmentHeading
                                        }
                                    >
                                        <Text
                                            style={
                                                styles.assignmentTitle
                                            }
                                        >
                                            📝 Module
                                            Assignment
                                        </Text>

                                        <Text
                                            style={
                                                styles.switchDescription
                                            }
                                        >
                                            Add an
                                            assessment
                                            to this
                                            module.
                                        </Text>
                                    </View>

                                    <Switch
                                        value={
                                            module
                                                .assignment
                                                .enabled
                                        }
                                        onValueChange={() =>
                                            toggleAssignment(
                                                moduleIndex
                                            )
                                        }
                                    />
                                </View>

                                {module
                                    .assignment
                                    .enabled && (
                                    <>
                                        <Text
                                            style={
                                                styles.label
                                            }
                                        >
                                            Assignment
                                            Title
                                        </Text>

                                        <TextInput
                                            style={
                                                styles.input
                                            }
                                            value={
                                                module
                                                    .assignment
                                                    .title
                                            }
                                            onChangeText={(
                                                value
                                            ) =>
                                                updateAssignment(
                                                    moduleIndex,
                                                    "title",
                                                    value
                                                )
                                            }
                                            placeholder="Example: Module 1 Assessment"
                                        />

                                        <Text
                                            style={
                                                styles.label
                                            }
                                        >
                                            Instructions
                                        </Text>

                                        <TextInput
                                            style={
                                                styles.textAreaSmall
                                            }
                                            value={
                                                module
                                                    .assignment
                                                    .instructions
                                            }
                                            onChangeText={(
                                                value
                                            ) =>
                                                updateAssignment(
                                                    moduleIndex,
                                                    "instructions",
                                                    value
                                                )
                                            }
                                            placeholder="Instructions for the student..."
                                            multiline
                                            textAlignVertical="top"
                                        />

                                        <Text
                                            style={
                                                styles.label
                                            }
                                        >
                                            Assignment
                                            Pass Mark
                                        </Text>

                                        <TextInput
                                            style={
                                                styles.smallInput
                                            }
                                            value={
                                                module
                                                    .assignment
                                                    .passMark
                                            }
                                            onChangeText={(
                                                value
                                            ) =>
                                                updateAssignment(
                                                    moduleIndex,
                                                    "passMark",
                                                    value
                                                )
                                            }
                                            keyboardType="numeric"
                                        />

                                        <Text
                                            style={
                                                styles.assignmentQuestionsTitle
                                            }
                                        >
                                            Assignment
                                            Questions
                                        </Text>

                                        {module
                                            .assignment
                                            .questions
                                            .map(
                                                (
                                                    question,
                                                    questionIndex
                                                ) =>
                                                    renderQuestion(
                                                        question,
                                                        questionIndex,
                                                        (
                                                            field,
                                                            value
                                                        ) =>
                                                            updateAssignmentQuestion(
                                                                moduleIndex,
                                                                questionIndex,
                                                                field,
                                                                value
                                                            ),
                                                        () =>
                                                            removeAssignmentQuestion(
                                                                moduleIndex,
                                                                questionIndex
                                                            )
                                                    )
                                            )}

                                        <TouchableOpacity
                                            style={
                                                styles.secondaryButton
                                            }
                                            onPress={() =>
                                                addAssignmentQuestion(
                                                    moduleIndex
                                                )
                                            }
                                        >
                                            <Text
                                                style={
                                                    styles.secondaryButtonText
                                                }
                                            >
                                                + Add
                                                Assignment
                                                Question
                                            </Text>
                                        </TouchableOpacity>
                                    </>
                                )}
                            </View>
                        </View>
                    )
                )}


                {/* =================================================
                    ADD MODULE
                ================================================== */}

                <TouchableOpacity
                    style={
                        styles.addModuleButton
                    }
                    onPress={addModule}
                >
                    <Text
                        style={
                            styles.addModuleButtonText
                        }
                    >
                        + Add Module
                    </Text>
                </TouchableOpacity>


                {/* =================================================
                    FINAL EXAM
                ================================================== */}

                <View
                    style={
                        styles.finalExamSection
                    }
                >
                    <View
                        style={
                            styles.switchRow
                        }
                    >
                        <View
                            style={
                                styles.assignmentHeading
                            }
                        >
                            <Text
                                style={
                                    styles.finalExamTitle
                                }
                            >
                                🎓 Final
                                Examination
                            </Text>

                            <Text
                                style={
                                    styles.switchDescription
                                }
                            >
                                Add the final
                                examination for
                                the course.
                            </Text>
                        </View>

                        <Switch
                            value={
                                finalExam.enabled
                            }
                            onValueChange={
                                toggleFinalExam
                            }
                        />
                    </View>

                    {finalExam.enabled && (
                        <>
                            <Text
                                style={
                                    styles.label
                                }
                            >
                                Examination Title
                            </Text>

                            <TextInput
                                style={
                                    styles.input
                                }
                                value={
                                    finalExam.title
                                }
                                onChangeText={(
                                    value
                                ) =>
                                    updateFinalExam(
                                        "title",
                                        value
                                    )
                                }
                                placeholder="Final Examination"
                            />

                            <Text
                                style={
                                    styles.label
                                }
                            >
                                Instructions
                            </Text>

                            <TextInput
                                style={
                                    styles.textAreaSmall
                                }
                                value={
                                    finalExam.instructions
                                }
                                onChangeText={(
                                    value
                                ) =>
                                    updateFinalExam(
                                        "instructions",
                                        value
                                    )
                                }
                                placeholder="Instructions for the final examination..."
                                multiline
                                textAlignVertical="top"
                            />

                            <Text
                                style={
                                    styles.label
                                }
                            >
                                Duration
                                (minutes)
                            </Text>

                            <TextInput
                                style={
                                    styles.smallInput
                                }
                                value={
                                    finalExam.durationMinutes
                                }
                                onChangeText={(
                                    value
                                ) =>
                                    updateFinalExam(
                                        "durationMinutes",
                                        value
                                    )
                                }
                                keyboardType="numeric"
                                placeholder="60"
                            />

                            <Text
                                style={
                                    styles.label
                                }
                            >
                                Final Exam Pass
                                Mark
                            </Text>

                            <TextInput
                                style={
                                    styles.smallInput
                                }
                                value={
                                    finalExam.passMark
                                }
                                onChangeText={(
                                    value
                                ) =>
                                    updateFinalExam(
                                        "passMark",
                                        value
                                    )
                                }
                                keyboardType="numeric"
                            />

                            <Text
                                style={
                                    styles.assignmentQuestionsTitle
                                }
                            >
                                Examination
                                Questions
                            </Text>

                            {finalExam.questions.map(
                                (
                                    question,
                                    questionIndex
                                ) =>
                                    renderQuestion(
                                        question,
                                        questionIndex,
                                        (
                                            field,
                                            value
                                        ) =>
                                            updateFinalExamQuestion(
                                                questionIndex,
                                                field,
                                                value
                                            ),
                                        () =>
                                            removeFinalExamQuestion(
                                                questionIndex
                                            )
                                    )
                            )}

                            <TouchableOpacity
                                style={
                                    styles.secondaryButton
                                }
                                onPress={
                                    addFinalExamQuestion
                                }
                            >
                                <Text
                                    style={
                                        styles.secondaryButtonText
                                    }
                                >
                                    + Add Final
                                    Examination
                                    Question
                                </Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>


                {/* =================================================
                    UPLOAD EXPLANATION
                ================================================== */}

                <View
                    style={
                        styles.nextStepBox
                    }
                >
                    <Text
                        style={
                            styles.nextStepTitle
                        }
                    >
                        📚 Course Materials
                    </Text>

                    <Text
                        style={
                            styles.nextStepText
                        }
                    >
                        After you save this
                        course, you will be
                        taken to Edit Course.
                        From there you can
                        upload multiple PDFs,
                        audio recordings and
                        videos directly to each
                        individual lesson.
                    </Text>

                    <Text
                        style={
                            styles.nextStepStructure
                        }
                    >
                        Module → Lesson → PDF /
                        Audio / Video
                    </Text>
                </View>


                {/* =================================================
                    SAVE BUTTON
                ================================================== */}

                <TouchableOpacity
                    style={[
                        styles.saveButton,
                        saving &&
                            styles.saveButtonDisabled,
                    ]}
                    onPress={
                        handleCreateCourse
                    }
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator
                            color="#fff"
                        />
                    ) : (
                        <Text
                            style={
                                styles.saveButtonText
                            }
                        >
                            Create Course &
                            Continue
                        </Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={
                        styles.cancelButton
                    }
                    onPress={() =>
                        router.back()
                    }
                    disabled={saving}
                >
                    <Text
                        style={
                            styles.cancelButtonText
                        }
                    >
                        Cancel
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}


/**
 * ============================================================
 * STYLES
 * ============================================================
 */

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f7fb",
    },

    content: {
        padding: 20,
        paddingBottom: 60,
    },

    header: {
        marginBottom: 24,
    },

    headerTitle: {
        fontSize: 28,
        fontWeight: "800",
        color: "#172033",
        marginBottom: 6,
    },

    headerSubtitle: {
        fontSize: 14,
        color: "#667085",
        lineHeight: 21,
    },

    section: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 18,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "#e6eaf0",
    },

    sectionTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: "#172033",
        marginBottom: 16,
    },

    label: {
        fontSize: 13,
        fontWeight: "700",
        color: "#344054",
        marginBottom: 7,
        marginTop: 13,
    },

    input: {
        backgroundColor: "#f8fafc",
        borderWidth: 1,
        borderColor: "#d9dee8",
        borderRadius: 10,
        paddingHorizontal: 13,
        paddingVertical: 12,
        fontSize: 14,
        color: "#172033",
    },

    smallInput: {
        backgroundColor: "#f8fafc",
        borderWidth: 1,
        borderColor: "#d9dee8",
        borderRadius: 10,
        paddingHorizontal: 13,
        paddingVertical: 12,
        fontSize: 14,
        color: "#172033",
        width: 130,
    },

    textArea: {
        backgroundColor: "#f8fafc",
        borderWidth: 1,
        borderColor: "#d9dee8",
        borderRadius: 10,
        paddingHorizontal: 13,
        paddingVertical: 12,
        fontSize: 14,
        color: "#172033",
        minHeight: 130,
    },

    textAreaSmall: {
        backgroundColor: "#f8fafc",
        borderWidth: 1,
        borderColor: "#d9dee8",
        borderRadius: 10,
        paddingHorizontal: 13,
        paddingVertical: 12,
        fontSize: 14,
        color: "#172033",
        minHeight: 90,
        textAlignVertical: "top",
    },

    priceBox: {
        backgroundColor: "#eef5ff",
        borderRadius: 10,
        padding: 15,
        borderWidth: 1,
        borderColor: "#cfe0ff",
    },

    priceText: {
        fontSize: 22,
        fontWeight: "800",
        color: "#175cd3",
    },

    priceNote: {
        fontSize: 12,
        color: "#667085",
        marginTop: 3,
    },

    switchRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 14,
        borderTopWidth: 1,
        borderTopColor: "#edf0f5",
        marginTop: 16,
    },

    switchTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: "#172033",
    },

    switchDescription: {
        fontSize: 12,
        color: "#667085",
        marginTop: 3,
        maxWidth: 280,
        lineHeight: 17,
    },

    structureHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 15,
    },

    structureHeaderText: {
        flex: 1,
        paddingRight: 10,
    },

    structureDescription: {
        fontSize: 13,
        color: "#667085",
        lineHeight: 19,
    },

    moduleCountBadge: {
        backgroundColor: "#eaf2ff",
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 20,
    },

    moduleCountText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#175cd3",
    },

    moduleCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 18,
        marginBottom: 18,
        borderWidth: 1,
        borderColor: "#dfe5ee",
    },

    moduleHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },

    moduleTitleContainer: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },

    moduleNumber: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: "#172033",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 11,
    },

    moduleNumberText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "800",
    },

    moduleLabel: {
        fontSize: 13,
        fontWeight: "800",
        color: "#172033",
    },

    moduleHint: {
        fontSize: 11,
        color: "#667085",
        marginTop: 2,
    },

    removeText: {
        color: "#d92d20",
        fontSize: 12,
        fontWeight: "700",
    },

    subsectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 22,
        marginBottom: 10,
    },

    subsectionTitle: {
        fontSize: 17,
        fontWeight: "800",
        color: "#172033",
    },

    countText: {
        fontSize: 12,
        color: "#667085",
        fontWeight: "600",
    },

    lessonCard: {
        backgroundColor: "#f8fafc",
        borderRadius: 13,
        padding: 15,
        marginBottom: 13,
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },

    lessonHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    lessonTitle: {
        fontSize: 15,
        fontWeight: "800",
        color: "#344054",
    },

    materialSection: {
        marginTop: 18,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: "#e4e7ec",
    },

    materialTitle: {
        fontSize: 14,
        fontWeight: "800",
        color: "#172033",
    },

    materialDescription: {
        fontSize: 12,
        color: "#667085",
        lineHeight: 18,
        marginTop: 3,
        marginBottom: 10,
    },

    materialPreview: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#e3e8ef",
        borderRadius: 10,
        padding: 11,
        marginBottom: 8,
    },

    materialIcon: {
        width: 40,
        height: 40,
        borderRadius: 9,
        backgroundColor: "#f1f5f9",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 10,
    },

    materialIconText: {
        fontSize: 19,
    },

    materialPreviewText: {
        flex: 1,
    },

    materialPreviewTitle: {
        fontSize: 13,
        fontWeight: "700",
        color: "#344054",
    },

    materialPreviewDescription: {
        fontSize: 11,
        color: "#667085",
        marginTop: 2,
    },

    uploadNotice: {
        backgroundColor: "#fff8e6",
        borderWidth: 1,
        borderColor: "#f5d98a",
        borderRadius: 10,
        padding: 12,
        marginTop: 12,
    },

    uploadNoticeTitle: {
        fontSize: 13,
        fontWeight: "800",
        color: "#8a5b00",
    },

    uploadNoticeText: {
        fontSize: 12,
        color: "#795000",
        lineHeight: 18,
        marginTop: 3,
    },

    choiceRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },

    choiceButton: {
        borderWidth: 1,
        borderColor: "#d0d5dd",
        borderRadius: 9,
        paddingHorizontal: 12,
        paddingVertical: 9,
        backgroundColor: "#fff",
        marginBottom: 4,
    },

    choiceButtonActive: {
        backgroundColor: "#172033",
        borderColor: "#172033",
    },

    choiceText: {
        fontSize: 12,
        color: "#475467",
        fontWeight: "600",
    },

    choiceTextActive: {
        color: "#fff",
    },

    addLessonButton: {
        borderWidth: 1,
        borderColor: "#175cd3",
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: "center",
        marginTop: 4,
    },

    addLessonButtonText: {
        color: "#175cd3",
        fontWeight: "800",
        fontSize: 13,
    },

    assignmentSection: {
        marginTop: 22,
        paddingTop: 18,
        borderTopWidth: 1,
        borderTopColor: "#e4e7ec",
    },

    assignmentHeading: {
        flex: 1,
    },

    assignmentTitle: {
        fontSize: 15,
        fontWeight: "800",
        color: "#172033",
    },

    assignmentQuestionsTitle: {
        fontSize: 14,
        fontWeight: "800",
        color: "#344054",
        marginTop: 20,
        marginBottom: 8,
    },

    questionCard: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#dfe5ee",
        borderRadius: 11,
        padding: 13,
        marginBottom: 10,
    },

    questionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 5,
    },

    questionNumber: {
        fontSize: 13,
        fontWeight: "800",
        color: "#172033",
    },

    helperText: {
        fontSize: 11,
        color: "#667085",
        marginTop: 4,
    },

    secondaryButton: {
        borderWidth: 1,
        borderColor: "#98a2b3",
        borderRadius: 10,
        paddingVertical: 11,
        alignItems: "center",
        marginTop: 8,
    },

    secondaryButtonText: {
        color: "#344054",
        fontWeight: "700",
        fontSize: 13,
    },

    addModuleButton: {
        backgroundColor: "#172033",
        borderRadius: 12,
        paddingVertical: 15,
        alignItems: "center",
        marginBottom: 20,
    },

    addModuleButtonText: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "800",
    },

    finalExamSection: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 18,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "#dfe5ee",
    },

    finalExamTitle: {
        fontSize: 17,
        fontWeight: "800",
        color: "#172033",
    },

    nextStepBox: {
        backgroundColor: "#eef6ff",
        borderWidth: 1,
        borderColor: "#c9ddff",
        borderRadius: 14,
        padding: 16,
        marginBottom: 20,
    },

    nextStepTitle: {
        fontSize: 15,
        fontWeight: "800",
        color: "#175cd3",
        marginBottom: 6,
    },

    nextStepText: {
        fontSize: 13,
        color: "#344054",
        lineHeight: 20,
    },

    nextStepStructure: {
        fontSize: 13,
        fontWeight: "800",
        color: "#175cd3",
        marginTop: 10,
    },

    saveButton: {
        backgroundColor: "#175cd3",
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: "center",
        marginBottom: 10,
    },

    saveButtonDisabled: {
        opacity: 0.6,
    },

    saveButtonText: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "800",
    },

    cancelButton: {
        paddingVertical: 14,
        alignItems: "center",
    },

    cancelButtonText: {
        color: "#667085",
        fontSize: 14,
        fontWeight: "700",
    },
});