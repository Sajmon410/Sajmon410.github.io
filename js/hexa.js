let sesion = new Session();
let sesion_id = sesion.getSession();
let komentar = true;

if (sesion_id !== "") {
  async function populateUserData() {
    let user = new User();
    user = await user.get(sesion_id);
    document.querySelector("#username").innerText = user["username"];
    document.querySelector("#email").innerText = user["email"];
    document.querySelector("#korisnicko_ime").value = user["username"];
    document.querySelector("#edit_email").value = user["email"];
  }

  populateUserData();
} else {
  window.location.href = "/";
}

document.querySelector("#logout").addEventListener("click", (e) => {
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

document.querySelector("#editForm").addEventListener("submit", (e) => {
  e.preventDefault();
  let user = new User();
  user.username = document.querySelector("#korisnicko_ime").value;
  user.email = document.querySelector("#edit_email").value;
  user.edit();
});

document.querySelector("#deleteProfile").addEventListener("click", (e) => {
  e.preventDefault();
  let text = "Da li ste sigurni da želite da obrišete profil?";
  if (confirm(text) === true) {
    let user = new User();
    user.delete();
  }
});

document.querySelector("#postForm").addEventListener("submit", (e) => {
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

    let delete_post_html = "";
    if (sesion_id === post.user_id) {
      delete_post_html = `<button class="remove-btn" onclick="removeMyPost(this)"></button>`;
    }

    // Inicijalizuj post
    document.querySelector("#allPostsWrapper").innerHTML =
      `<div class="single-post" data_post_id="${post.id}">
        <div class="post-actions">
          <p><b>${current_user.username}</b></p>
          <div>
            <div class="post-content"><p class="postTekst">${post.content}</p></div> 
            <button onclick="likePost(this)" class="likePostJS like-btn"><span>${post.likes}</span></button>
            <button class="comment-btn" onclick="commentPost(this)">0</button>
            ${delete_post_html}
          </div>
        </div>
        <div class="post-comments">
          <form>
            <input placeholder="Napiši komentar..." type="text">
            <button class="comment" onclick="commentPostSubmit(event)">Comment</button>
          </form>
          <div class="comments-list"></div> <!-- Div za prikaz komentara -->
        </div>
      </div>` + html;
  }
  createPost();
});

async function getAllPosts() {
  let all_posts = new Post();
  all_posts = await all_posts.getAllPosts();

  all_posts.forEach((post) => {
    async function getPostUser() {
      let user = new User();
      user = await user.get(post.user_id);

      // Učitaj broj komentara za svaki post
      let comments = await getCommentsForPost(post.id); // Pretpostavljam da postoji metoda za uzimanje komentara
      let commentCount = comments.length;

      let delete_post_html = "";
      let html = document.querySelector("#allPostsWrapper").innerHTML;
      if (sesion_id === post.user_id) {
        delete_post_html = `<button class="remove-btn" onclick="removeMyPost(this)"></button>`;
      }

      // Prikazivanje postova sa brojem komentara
      document.querySelector("#allPostsWrapper").innerHTML =
        `<div class="single-post" data_post_id="${post.id}">
          <div class="post-actions">
            <p><b>${user.username}</b></p>
            <div>
              <div class="post-content"><p class="postTekst">${post.content}</p></div>
              <button onclick="likePost(this)" class="likePostJS like-btn"><span>${post.likes}</span></button>
              <button class="comment-btn" onclick="commentPost(this)">${commentCount}</button>
              ${delete_post_html}
            </div>
          </div>
          <div class="post-comments">
            <form>
              <input placeholder="Napiši komentar..." type="text">
              <button class="comment" onclick="commentPostSubmit(event)">Komentariši</button>
            </form>
            <div class="comments-list"></div> <!-- Div za prikaz komentara -->
          </div>
        </div>` + html;

      // Prikazivanje komentara za post
      displayComments(post.id);
    }
    getPostUser();
  });
}

async function getCommentsForPost(post_id) {
  // Pretpostavljam da postoji metod za dobijanje komentara za post
  let comments = new Comment();
  comments = await comments.getByPostId(post_id); // Pretpostavljam da postoji metod getByPostId
  return comments;
}

// Funkcija za prikazivanje komentara za post
async function displayComments(post_id) {
  let commentsList = document.querySelector(`[data_post_id="${post_id}"] .comments-list`);
  let comments = await getCommentsForPost(post_id);
  
  commentsList.innerHTML = ""; // Očisti prethodne komentare
  comments.forEach(comment => {
    let commentDiv = document.createElement('div');
    commentDiv.classList.add('single-comment');
    commentDiv.innerText = comment.content;
    commentsList.appendChild(commentDiv);
  });
}

// Funkcija za dodavanje komentara
const commentPostSubmit = (e) => {
  e.preventDefault();
  let btn = e.target;
  btn.setAttribute("disabled", "true");

  let main_post_el = btn.closest(".single-post");
  let post_id = main_post_el.getAttribute("data_post_id");

  let comment_value = main_post_el.querySelector("input").value;
  main_post_el.querySelector("input").value = " ";

  // Kreiraj novi komentar u bazi
  let comment = new Comment();
  comment.content = comment_value;
  comment.user_id = sesion_id;
  comment.post_id = post_id;
  comment.create();

  // Dodaj komentar na stranicu bez ponovnog učitavanja
  let commentsList = main_post_el.querySelector(".comments-list");
  let commentDiv = document.createElement('div');
  commentDiv.classList.add('single-comment');
  commentDiv.innerText = comment_value;
  commentsList.appendChild(commentDiv);

  // Ažuriraj broj komentara na dugmetu
  let commentBtn = main_post_el.querySelector(".comment-btn");
  let currentCount = parseInt(commentBtn.innerText);
  commentBtn.innerText = currentCount + 1;
};

const removeMyPost = (btn) => {
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
  let success = await post.like(post_id, number_of_likes + 1, sesion_id);
  if (success) {
    btn.querySelector("span").innerText = number_of_likes + 1;
    btn.setAttribute("disabled", "true");
  }
};

const commentPost = (btn) => {
  let main_post_el = btn.closest(".single-post");
  let post_comments_el = main_post_el.querySelector(".post-comments");
  post_comments_el.style.display = post_comments_el.style.display === "block" ? "none" : "block";
};

getAllPosts(); // Učitaj sve postove sa komentarima