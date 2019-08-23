import {Category, CategoryModel} from "../models/categories";
import {createHash} from "crypto";

const getObjectId = (...ids: string[]) => {
    const hash = createHash('sha1')
        .update(ids.join('-'), 'utf8')
        .digest('hex');
    return hash.substring(0, 24)
};

const CategoryRoot = new Category({
    title: '/',
    description: 'Root category',
    index: 0,
    category_type: 'general',
    parentId: undefined,
    contributors: [],
}, getObjectId('/', 'undefined'));
const CategoryMainStory2 = new Category({
    title: 'Мэйн Стори. Арка 2. Хоровод 100 несчастий.',
    parentId: CategoryRoot.id,
    contributors: [],
    index: 0,
    description: '',
    category_type: 'story',
    story_type: 'main_story',
}, getObjectId('main_story_2'));
const CategoryEvents = new Category({
    title: 'Ивент-стори',
    parentId: CategoryRoot.id,
    contributors: [],
    index: 1,
    description: "",
    category_type: 'general',
}, getObjectId('event_stories'));
const ExampleEvent = Category.fromDefault((m: CategoryModel) => {
    m.title = 'Example event story';
    m.parentId = CategoryEvents.id;
    m.index = 0;
    m.category_type = 'story';
    m.story_type = 'event';
    return getObjectId(m.title, m.parentId);
});
const ExampleEpisodes = [1, 2, 3].map((index) => {
    return Category.fromDefault((m) => {
        m.title = 'Часть ' + m;
        m.parentId = ExampleEvent.id;
        m.index = index;
        m.category_type = 'story';
        m.story_type = 'arc';
        return getObjectId('example_episode', 'part_' + index, m.parentId)
    });
});
