class Post {
    post_id = "";
    post_content = "";
    user_id = "";
    likes = "";
    api_url = 'https://63ad8e14ceaabafcf165b15d.mockapi.io';

    async create() {
        let session = new Session();
        let sesion_id = session.getSession();
        let data = {
            user_id: sesion_id,
            content: this.post_content,
            likes: 0
        };

        data = JSON.stringify(data);

        let response = await fetch(this.api_url + "/posts", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: data
        });
        data = await response.json();

        return data;
    }

    async getAllPosts() {
        let response = await fetch(this.api_url + '/posts');
        let data = await response.json();
        return data;
    }

    async like(post_id, likes, user_id) {
        // Proveri da li je korisnik već lajkovao
        let response = await fetch(`${this.api_url}/post_likes?post_id=${post_id}&user_id=${user_id}`);
        let data = await response.json();

        if (data.length > 0) {
            alert("Već ste lajkovali ovaj post!");
            return false;
        }

        // Ažuriraj broj lajkova na postu
        let postData = {
            likes: likes
        };

        postData = JSON.stringify(postData);
        await fetch(this.api_url + '/posts/' + post_id, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: postData
        });

        // Sačuvaj lajk u post_likes tabelu
        let likeData = {
            post_id: post_id,
            user_id: user_id
        };

        likeData = JSON.stringify(likeData);
        await fetch(this.api_url + '/post_likes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: likeData
        });

        alert("Post lajkovan!");
        return true;
    }

    async delete(post_id) {
        await fetch(this.api_url + '/posts/' + post_id, {
            method: 'DELETE'
        })
            .then(response => response.json())
            .then(data => {
                alert("Post je obrisan");
            });
    }
}