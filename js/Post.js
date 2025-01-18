class Post {
    post_id = "";
    post_content = "";
    user_id = "";
    likes = 0;
    likedBy = [];
    api_url = 'https://63ad8e14ceaabafcf165b15d.mockapi.io';

    async create() {
        let session = new Session();
        let session_id = session.getSession();
        let data = {
            user_id: session_id,
            content: this.post_content,
            likes: 0,
            likedBy: [],
        };

        data = JSON.stringify(data);

        let response = await fetch(this.api_url + "/posts", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: data,
        });
        data = await response.json();

        return data;
    }

    async getAllPosts() {
        let response = await fetch(this.api_url + '/posts');
        let data = await response.json();
        return data;
    }

    async like(post_id, user_id) {
        let response = await fetch(this.api_url + '/posts/' + post_id);
        let post = await response.json();

        if (!post.likedBy.includes(user_id)) {
            post.likes++;
            post.likedBy.push(user_id);

            let data = JSON.stringify({
                likes: post.likes,
                likedBy: post.likedBy,
            });

            await fetch(this.api_url + '/posts/' + post_id, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: data,
            });
            alert("Post lajkovan");
        } else {
            alert("Već ste lajkovali ovaj post!");
        }
    }

    delete(post_id) {
        fetch(this.api_url + '/posts/' + post_id, {
            method: 'DELETE',
        })
            .then(response => response.json())
            .then(data => {
                alert("Post je obrisan");
            });
    }
}