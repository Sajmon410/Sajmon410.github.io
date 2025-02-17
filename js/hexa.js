let sesion = new Session();
sesion_id = sesion.getSession();
let komentar = true;

if (sesion_id !== "") {
    async function populateUserData() {
        let user = new User();
        user = await user.get(sesion_id);
        document.querySelector("#username").innerText = user['username'];
        document.querySelector("#email").innerText = user['email'];

        document.querySelector("#korisnicko_ime").value = user['username'];
        document.querySelector("#edit_email").value = user['email'];
    }

    populateUserData();
} else {
    window.location.href = "/";
}

document.querySelector("#logout").addEventListener("click", e => {
    e.preventDefault();

    sesion.destroySession();
    window.location.href = "/";
});

document.querySelector("#editAccount").addEventListener("click", () => {
    document.querySelector(".custom-modal").style.display = "block";
});
document.querySelector("#closeModal").addEventListener("click", () => {
    document.querySelector(".custom-modal").style.display = "none";
});

document.querySelector("#editForm").addEventListener("submit", e => {
    e.preventDefault();
    let user = new User();
    user.username = document.querySelector("#korisnicko_ime").value;
    user.email = document.querySelector("#edit_email").value;
    user.edit();
});

document.querySelector("#deleteProfile").addEventListener("click", e => {
    e.preventDefault();

    let text = "Da li ste sigurni da zelite da obrisete profil?";

    if (confirm(text) === true) {
        let user = new User();
        user.delete();
    }
});

document.querySelector("#postForm").addEventListener("submit", e => {
    e.preventDefault();

    async function createPost() {
        let content = document.querySelector("#postContent").value;
        document.querySelector("#postContent").value = "";
        let post = new Post();
        post.post_content = content;
        post = await post.create();

        let current_user = new User();
        current_user = await current_user.get(sesion_id);

        let html = document.querySelector("#allPostsWrapper").innerHTML;

        let delete_post_html = '';
        if (sesion_id === post.user_id) {
            delete_post_html = `<button class="remove-btn" onclick="removeMyPost(this)"></button>`;
        }

        document.querySelector("#allPostsWrapper").innerHTML = `<div class="single-post" data_post_id="${post.id}">
            <div class="post-actions">
                <p><b>${current_user.username}</b></p>
                <div>
                    <div class="post-content"><p class="postTekst">${post.content}</p></div> 
                    <button class="likePostJS like-btn"><span>${post.likes}</span></button>
                    <button class="comment-btn" onclick="commentPost(this)">${0}</button>
                    ${delete_post_html}
                </div>
            </div>
            <div class="post-comments">
                <form>
                    <input placeholder="Napiši komentar..." type="text" pattern="[A-Za-z]*">
                    <button class="comment" onclick="commentPostSubmit(event)">
                        <img src="../img/message.png" alt="Comment" class="comment-icon">
                    </button>
                </form>
            </div>
        </div>` + html;

        // Dodavanje event listener-a za novo dugme like
        document.querySelectorAll('.likePostJS').forEach(btn => {
            btn.addEventListener("click", function() {
                likePost(this);
            });
        });
    }

    createPost();
});

async function getAllPosts() {
    let all_posts = new Post();
    all_posts = await all_posts.getAllPosts();

    all_posts.forEach(post => {
        async function getPostUser() {
            let user = new User();
            user = await user.get(post.user_id);

            let comments = new Comment();
            comments = await comments.get(post.id);
            let comments_html = '';
            if (comments.length > 0) {
                comments_html = await Promise.all(comments.map(async comment => {
                    let comment_user = new User();
                    comment_user = await comment_user.get(comment.user_id);
                
                    return `<div class="single-comment"><b>${comment_user.username}:</b> ${comment.content}</div>`;
                })).then(htmlArray => htmlArray.join(''));
            }

            let delete_post_html = "";
            let html = document.querySelector("#allPostsWrapper").innerHTML;
            if (sesion_id === post.user_id) {
                delete_post_html = `<button class="remove-btn" onclick="removeMyPost(this)"></button>`;
            }

            let like_disabled = post.likedBy.includes(sesion_id) ? "disabled" : "";

            document.querySelector("#allPostsWrapper").innerHTML = `<div class="single-post" data_post_id="${post.id}">
                <div class="post-actions">
                    <p><b>${user.username}</b></p>
                    <div>
                        <div class="post-content"><p class="postTekst">${post.content}</p></div> 
                        <button class="likePostJS like-btn" ${like_disabled}><span>${post.likes}</span></button>
                        <button class="comment-btn" onclick="commentPost(this)">${comments.length}</button>
                        ${delete_post_html}
                    </div>
                </div>
                <div class="post-comments">
                    <form>
                        <input placeholder="Napiši komentar..." type="text" pattern="[A-Za-z]*">
                        <button class="comment" onclick="commentPostSubmit(event)">
                            <img src="../img/message.png" alt="Comment" class="comment-icon">
                        </button>
                    </form>
                    ${comments_html}
                </div>
            </div>` + html;

            document.querySelectorAll('.likePostJS').forEach(btn => {
                btn.addEventListener("click", function() {
                    likePost(this);
                });
            });
        }

        getPostUser();
    });
}

getAllPosts();

const commentPostSubmit = async e => {
    e.preventDefault();
    let btn = e.target;
    btn.setAttribute("disabled", 'true');

    let main_post_el = btn.closest(".single-post");
    let post_id = main_post_el.getAttribute("data_post_id");

    let comment_value = main_post_el.querySelector("input").value;

    main_post_el.querySelector("input").value = "";

    let current_user = new User();
    current_user = await current_user.get(sesion_id);
    
    main_post_el.querySelector(".post-comments").innerHTML += `<div class="single-comment"><b>${current_user.username}:</b> ${comment_value}</div>`;

    let commentCounter = main_post_el.querySelector(".comment-btn");
    let currentCount = parseInt(commentCounter.innerText);
    commentCounter.innerText = currentCount + 1;

    let comment = new Comment();
    comment.content = comment_value;
    comment.user_id = sesion_id;
    comment.post_id = post_id;
    comment.create();
};

const removeMyPost = btn => {
    let post_id = btn.closest(".single-post").getAttribute("data_post_id");

    btn.closest(".single-post").remove();

    let post = new Post();
    post.delete(post_id);
};

const likePost = async (btn) => {
    let main_post_el = btn.closest(".single-post");
    let post_id = main_post_el.getAttribute("data_post_id");
    let number_of_likes = parseInt(btn.querySelector("span").innerText);

    let post = new Post();
    let response = await fetch(post.api_url + '/posts/' + post_id);
    let post_data = await response.json();

    if (post_data.likedBy.includes(sesion_id)) {
        alert("Već ste lajkovali ovaj post!");
        return;
    }

    btn.querySelector("span").innerText = number_of_likes + 1;
    btn.setAttribute("disabled", "true");

    try {
        const result = await post.like(post_id, sesion_id);

        if (!result.success) {
            btn.querySelector("span").innerText = number_of_likes;
            btn.removeAttribute("disabled");
            alert(result.message);
        }
    } catch (error) {
        // btn.querySelector("span").innerText = number_of_likes;
        // btn.removeAttribute("disabled");
        // alert("Greška prilikom lajkovanja. Pokušajte ponovo.");
    }
};
const commentPost = btn => {
    let main_post_el = btn.closest('.single-post');
    let post_id = main_post_el.getAttribute("data_post_id");
    if (komentar === true) {
        main_post_el.querySelector(".post-comments").style.display = "block"; 
        komentar = false;
    } else if (komentar === false) {
        main_post_el.querySelector(".post-comments").style.display = "none"; 
        komentar = true;
    }
};
