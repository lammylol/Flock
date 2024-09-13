// CommentsView.swift
// Flock 
//
// provides the UI for viewing and adding comments
//
// Created by Ramon Jiang 09/011/24


import SwiftUI

struct CommentsView: View {
    let postID: String
    @StateObject private var viewModel = CommentViewModel()
    @State private var newCommentText = ""
    @Environment(UserProfileHolder.self) var userHolder
    
    var body: some View {
        VStack {
            if viewModel.isLoading {
                ProgressView()
            } else if viewModel.comments.isEmpty {
                Text("No comments yet. Be the first to comment!")
                    .foregroundColor(.secondary)
                    .padding()
            } else {
                List {
                    ForEach(viewModel.comments) { comment in
                        CommentRow(comment: comment)
                    }
                }
                .listStyle(PlainListStyle())
            }
            
            VStack {
                if let errorMessage = viewModel.errorMessage {
                    Text(errorMessage)
                        .foregroundColor(.red)
                        .padding(.horizontal)
                }
                
                HStack {
                    TextField("Add a comment", text: $newCommentText)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                    Button("Post") {
                        viewModel.addComment(to: postID, text: newCommentText, person: userHolder.person)
                        newCommentText = ""
                    }
                    .disabled(newCommentText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
                .padding()
            }
            .background(Color(.systemBackground))
            .shadow(radius: 2)
        }
        .navigationTitle("Comments")
        .onAppear {
            viewModel.fetchComments(for: postID)
        }
    }
}

struct CommentRow: View {
    let comment: Comment
    
    var body: some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(comment.username)
                .font(.headline)
            Text(comment.text)
                .font(.body)
            Text(comment.createdAt, style: .date)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding(.vertical, 5)
    }
}
