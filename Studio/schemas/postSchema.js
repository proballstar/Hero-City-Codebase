export const postSchema = {
    name: "post",
    title: "Post",
    type: "document",
    fields: [
        {
            title: "Name",
            name: "name",
            type: "string"
        },
        {
            title: "Poster",
            name: "poster",
            type: "string"
        },
        {
            title: "Content",
            name: "content",
            type: "string"
        },
        {
            title: "Owner",
            name: "owner",
            type: "string"
        },
        {
            title: "Hero Address",
            name: "hero_wallet",
            type: "string"
        }
    ]
}