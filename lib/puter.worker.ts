
const PROJECT_PREFIX = "roomify_project_";
const jsonError = (status, message, extra = {}) => {
        return new Response(JSON.stringify({ error: message, ...extra }), { status, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } })
}

const getUserId = async (userPuter) => {
    try {
        const user = await userPuter.auth.getUser();

        return user?.uuid || null;
    } catch {
        return null;
    }
}

router.post("/api/projects/save", async({ request, user}) => {
    try {
        const userPuter = user.puter
        if (!userPuter) return jsonError(401, "Unauthorized: Authentication Failed");
        
        const body = await request.json();
        const project = body?.project

        if(!project?.id || !project?.sourceImage) return jsonError(400, "Project not found or missing source image")

        const payload = {
            ...project,
            updatedAt: new Date().toISOString(),
        }

        const userId = await getUserId(userPuter);
        if(!userId) return jsonError(401, "Unauthorized: User Not Found")

        const key = `${PROJECT_PREFIX}${project.id}`;
        await userPuter.kv.set(key, payload)

        return { saved: true, id: project.id, project: payload }
    } catch (err) {
        return jsonError(500, "Failed to save prject", { message: err.message || "Unknown Error"})
    }
})

router.get("/api/projects/list", async ({ request, user }) => {
    try {
        const userPuter = user.puter;
        if (!userPuter) return jsonError(401, "Unauthorized: Authentication Failed");

        const userId = await getUserId(userPuter);
        if (!userId) return jsonError(401, "Unauthorized: User Not Found");

        const projects = (await userPuter.kv.list(PROJECT_PREFIX, true))
            .map(({ value }) => ({ ...value, isPublic: true }))

        return { projects }
    } catch (err) {
        return jsonError(500, "Failed to list projects", { message: err.message || "Unknown Error" });
    }
});

router.get("/api/projects/get", async ({ request, user }) => {
    try {
        const userPuter = user.puter;
        if (!userPuter) return jsonError(401, "Unauthorized: Authentication Failed");

        const userId = await getUserId(userPuter);
        if (!userId) return jsonError(401, "Unauthorized: User Not Found");

        const url = new URL(request.url);
        const id = url.searchParams.get("id");
        if (!id) return jsonError(400, "Missing project id");

        const key = `${PROJECT_PREFIX}${id}`;
        const project = await userPuter.kv.get(key);
        if (!project) return jsonError(404, "Project not found");

        return { project };
    } catch (err) {
        return jsonError(500, "Failed to fetch project", { message: err.message || "Unknown Error" });
    }
});